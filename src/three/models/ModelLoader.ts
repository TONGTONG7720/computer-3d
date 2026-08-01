import { MeshoptDecoder } from "meshoptimizer";
import {
  type Group,
  LoadingManager,
  type Material,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  type Texture,
  type WebGLRenderer,
} from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import type { ModelCache } from "./ModelCache";
import type { ModelManifest } from "./modelManifest";

export type ModelProgressEvent = {
  readonly loaded: number;
  readonly total: number;
};

export type LoadedModel = {
  readonly scene: Group;
};

export interface ModelLoaderPort {
  readonly loadAsync: (
    url: string,
    onProgress?: (event: ModelProgressEvent) => void,
  ) => Promise<LoadedModel>;
}

export type ModelLoaderState =
  | {
      readonly status: "idle";
    }
  | {
      readonly status: "loading";
      readonly assetId: string;
      readonly progress: number | undefined;
    }
  | {
      readonly status: "ready";
      readonly assetId: string;
    }
  | {
      readonly status: "error";
      readonly assetId: string;
      readonly message: string;
    };

type StateListener = (state: ModelLoaderState) => void;

export class ModelLoadError extends Error {
  readonly assetId: string;
  readonly modelUrl: string;

  constructor(assetId: string, modelUrl: string, cause: unknown) {
    super(`Failed to load model "${assetId}" from "${modelUrl}".`, { cause });
    this.name = "ModelLoadError";
    this.assetId = assetId;
    this.modelUrl = modelUrl;
  }
}

type ThreeModelLoaderOptions = {
  readonly renderer?: WebGLRenderer;
  readonly dracoDecoderPath?: string;
  readonly ktx2TranscoderPath?: string;
};

export class ThreeModelLoaderPort implements ModelLoaderPort {
  private readonly loader: GLTFLoader;
  private readonly dracoLoader?: DRACOLoader;
  private readonly ktx2Loader?: KTX2Loader;

  constructor(options: ThreeModelLoaderOptions = {}) {
    const manager = new LoadingManager();
    this.loader = new GLTFLoader(manager);
    this.loader.setMeshoptDecoder(MeshoptDecoder);

    if (options.dracoDecoderPath !== undefined) {
      this.dracoLoader = new DRACOLoader(manager);
      this.dracoLoader.setDecoderPath(options.dracoDecoderPath);
      this.loader.setDRACOLoader(this.dracoLoader);
    }

    if (options.renderer !== undefined && options.ktx2TranscoderPath !== undefined) {
      this.ktx2Loader = new KTX2Loader(manager);
      this.ktx2Loader.setTranscoderPath(options.ktx2TranscoderPath);
      this.ktx2Loader.detectSupport(options.renderer);
      this.loader.setKTX2Loader(this.ktx2Loader);
    }
  }

  async loadAsync(
    url: string,
    onProgress?: (event: ModelProgressEvent) => void,
  ): Promise<LoadedModel> {
    const gltf = await this.loader.loadAsync(url, (event) => {
      onProgress?.({
        loaded: event.loaded,
        total: event.total,
      });
    });
    return { scene: gltf.scene };
  }

  dispose(): void {
    this.dracoLoader?.dispose();
    this.ktx2Loader?.dispose();
  }
}

const collectMaterialTextures = (material: Material, textures: Set<Texture>): void => {
  if (material instanceof MeshStandardMaterial) {
    const candidates = [
      material.map,
      material.normalMap,
      material.roughnessMap,
      material.metalnessMap,
      material.emissiveMap,
      material.alphaMap,
      material.aoMap,
    ];
    for (const texture of candidates) {
      if (texture !== null) {
        textures.add(texture);
      }
    }
  }
};

export const disposeModelResources = (root: Object3D): void => {
  const geometries = new Set<Mesh["geometry"]>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();

  root.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }

    geometries.add(object.geometry);
    if (Array.isArray(object.material)) {
      for (const material of object.material) {
        materials.add(material);
      }
      return;
    }
    materials.add(object.material);
  });

  for (const geometry of geometries) {
    geometry.dispose();
  }
  for (const material of materials) {
    collectMaterialTextures(material, textures);
    material.dispose();
  }
  for (const texture of textures) {
    texture.dispose();
  }
};

export class ModelLoader {
  private readonly cache: ModelCache;
  private readonly port: ModelLoaderPort;
  private readonly listener: StateListener | undefined;
  private readonly pending = new Map<string, Promise<void>>();

  constructor(cache: ModelCache, port: ModelLoaderPort, listener?: StateListener) {
    this.cache = cache;
    this.port = port;
    this.listener = listener;
  }

  lazy(manifest: ModelManifest): () => Promise<Group> {
    return () => this.load(manifest);
  }

  async load(manifest: ModelManifest): Promise<Group> {
    const cached = this.cache.acquire(manifest.assetId);
    if (cached !== undefined) {
      this.emit({
        status: "ready",
        assetId: manifest.assetId,
      });
      return cached;
    }

    let pendingLoad = this.pending.get(manifest.assetId);
    if (pendingLoad === undefined) {
      pendingLoad = this.loadTemplate(manifest);
      this.pending.set(manifest.assetId, pendingLoad);
    }

    try {
      await pendingLoad;
      const model = this.cache.acquire(manifest.assetId);
      if (model === undefined) {
        throw new ModelLoadError(manifest.assetId, manifest.url, "Cache population failed.");
      }
      this.emit({
        status: "ready",
        assetId: manifest.assetId,
      });
      return model;
    } finally {
      this.pending.delete(manifest.assetId);
    }
  }

  release(assetId: string): boolean {
    return this.cache.release(assetId);
  }

  disposeUnused(): number {
    return this.cache.clearUnused();
  }

  private async loadTemplate(manifest: ModelManifest): Promise<void> {
    let latestProgress = 0;
    this.emit({
      status: "loading",
      assetId: manifest.assetId,
      progress: 0,
    });

    try {
      const loaded = await this.port.loadAsync(manifest.url, (event) => {
        const measuredProgress = event.total > 0 ? event.loaded / event.total : undefined;
        if (measuredProgress !== undefined) {
          latestProgress = Math.max(latestProgress, Math.min(measuredProgress, 1));
        }
        this.emit({
          status: "loading",
          assetId: manifest.assetId,
          progress: measuredProgress === undefined ? undefined : latestProgress,
        });
      });
      loaded.scene.name = `TPL_${manifest.componentType.toUpperCase()}_${manifest.assetId}`;
      this.cache.store(manifest.assetId, loaded.scene, () => {
        disposeModelResources(loaded.scene);
      });
    } catch (error) {
      const wrappedError =
        error instanceof ModelLoadError
          ? error
          : new ModelLoadError(manifest.assetId, manifest.url, error);
      this.emit({
        status: "error",
        assetId: manifest.assetId,
        message: wrappedError.message,
      });
      throw wrappedError;
    }
  }

  private emit(state: ModelLoaderState): void {
    this.listener?.(state);
  }
}
