import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture } from "three";
import { describe, expect, it, vi } from "vitest";
import { ModelCache } from "./ModelCache";
import {
  disposeModelResources,
  ModelLoadError,
  ModelLoader,
  type ModelLoaderPort,
  type ModelLoaderState,
} from "./ModelLoader";
import { parseModelManifest } from "./modelManifest";

const manifest = parseModelManifest({
  assetId: "gpu-rtx5090",
  componentType: "gpu",
  url: "/models/gpu_rtx5090.glb",
  fallback: "placeholder",
  transform: {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  },
  installation: {
    entryOffset: [2, 0.5, 0],
    durationMs: 1200,
  },
  lod: [],
});

describe("ModelLoader", () => {
  it("defers network work until a lazy load is invoked", async () => {
    const port: ModelLoaderPort = {
      loadAsync: vi.fn(async () => ({ scene: new Group() })),
    };
    const loader = new ModelLoader(new ModelCache(), port);

    const lazyLoad = loader.lazy(manifest);
    expect(port.loadAsync).not.toHaveBeenCalled();

    const model = await lazyLoad();
    expect(model).toBeInstanceOf(Group);
    expect(port.loadAsync).toHaveBeenCalledOnce();
  });

  it("reports progress and reuses the cached template", async () => {
    const port: ModelLoaderPort = {
      loadAsync: vi.fn(async (_url, onProgress) => {
        onProgress?.({ loaded: 50, total: 100 });
        return { scene: new Group() };
      }),
    };
    const states: ModelLoaderState[] = [];
    const loader = new ModelLoader(new ModelCache(), port, (state) => {
      states.push(state);
    });

    const first = await loader.load(manifest);
    const second = await loader.load(manifest);

    expect(first).not.toBe(second);
    expect(port.loadAsync).toHaveBeenCalledOnce();
    expect(states.some((state) => state.status === "loading" && state.progress === 0.5)).toBe(true);
    expect(states.at(-1)?.status).toBe("ready");
  });

  it("wraps loader failures in a typed error", async () => {
    const port: ModelLoaderPort = {
      loadAsync: vi.fn(async () => {
        throw new Error("404");
      }),
    };
    const states: ModelLoaderState[] = [];
    const loader = new ModelLoader(new ModelCache(), port, (state) => {
      states.push(state);
    });

    await expect(loader.load(manifest)).rejects.toBeInstanceOf(ModelLoadError);
    expect(states.at(-1)?.status).toBe("error");
  });

  it("never reports lower progress after more bytes have already loaded", async () => {
    // Given
    const port: ModelLoaderPort = {
      loadAsync: vi.fn(async (_url, onProgress) => {
        onProgress?.({ loaded: 80, total: 100 });
        onProgress?.({ loaded: 30, total: 100 });
        return { scene: new Group() };
      }),
    };
    const progress: number[] = [];
    const loader = new ModelLoader(new ModelCache(), port, (state) => {
      if (state.status === "loading" && state.progress !== undefined) {
        progress.push(state.progress);
      }
    });

    // When
    await loader.load(manifest);

    // Then
    expect(progress).toEqual([0, 0.8, 0.8]);
  });

  it("disposes a shared texture once when a model leaves the cache", () => {
    // Given
    const texture = new Texture();
    const disposeTexture = vi.spyOn(texture, "dispose");
    const firstMaterial = new MeshStandardMaterial({ map: texture });
    const secondMaterial = new MeshStandardMaterial({ map: texture });
    const root = new Group();
    root.add(new Mesh(new BoxGeometry(), firstMaterial));
    root.add(new Mesh(new BoxGeometry(), secondMaterial));

    // When
    disposeModelResources(root);

    // Then
    expect(disposeTexture).toHaveBeenCalledOnce();
  });
});
