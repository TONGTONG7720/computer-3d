"use client";

import { Sparkles } from "@react-three/drei";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Object3D, Vector3Tuple } from "three";
import { engineStore, useEngineStore } from "@/store/engineStore";
import { playExplosionAnimation } from "../animation/ExplosionAnimation";
import {
  playInstallationAnimation,
  playRemovalAnimation,
} from "../animation/InstallationAnimation";
import { createDemoAssembly, createPlaceholderComponent } from "../components/PCAssembly";
import {
  ComponentReplacementManager,
  type ReplacementSlot,
} from "../core/ComponentReplacementManager";
import { configureSceneLod } from "../core/LODSystem";
import type { QualityProfile } from "../core/QualityManager";
import { type SceneComponent, SceneManager } from "../core/SceneManager";
import { demoCpuOptions, demoGpuOptions } from "../demo/demoHardware";
import { resolveSelection, SelectionSystem } from "../interaction/SelectionSystem";
import { materialTokens, setRgbColor } from "../materials/MaterialSystem";
import { ModelCache } from "../models/ModelCache";
import { disposeModelResources } from "../models/ModelLoader";
import type { ModelManifest } from "../models/modelManifest";

const demoOptions = [...demoCpuOptions, ...demoGpuOptions];

type PCSceneProps = {
  readonly profile: QualityProfile;
  readonly reducedMotion: boolean;
};

type StoredComponentTransform = {
  readonly position: Vector3Tuple;
  readonly rotation: Vector3Tuple;
  readonly scale: Vector3Tuple;
};

const readTransform = (object: Object3D): StoredComponentTransform => ({
  position: [object.position.x, object.position.y, object.position.z],
  rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
  scale: [object.scale.x, object.scale.y, object.scale.z],
});

const restoreTransform = (object: Object3D, transform: StoredComponentTransform): void => {
  object.position.set(...transform.position);
  object.rotation.set(...transform.rotation);
  object.scale.set(...transform.scale);
};

const findManifest = (assetId: string): ModelManifest | undefined =>
  demoOptions.find((option) => option.id === assetId)?.manifest;

const findVariant = (assetId: string): string =>
  demoOptions.find((option) => option.id === assetId)?.variant ?? "default";

const waitForPlaceholderDecode = (): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, 180);
  });

const collectSpinningFans = (root: Object3D): readonly Object3D[] => {
  const fans: Object3D[] = [];
  root.traverse((object) => {
    if (
      object.name.startsWith("GEO_GPU_FAN_") ||
      object.name.startsWith("GEO_CASE_FAN_") ||
      object.name.startsWith("GEO_COOLING_FAN_")
    ) {
      fans.push(object);
    }
  });
  return fans;
};

export function PCScene({ profile, reducedMotion }: PCSceneProps) {
  const manager = useMemo(() => {
    const sceneManager = new SceneManager();
    for (const component of createDemoAssembly()) {
      sceneManager.register(component);
    }
    return sceneManager;
  }, []);
  const cache = useMemo(() => new ModelCache(), []);
  const selection = useMemo(() => new SelectionSystem(), []);
  const [, setComponentRevision] = useState(0);
  const runningRequest = useRef<number | null>(null);

  const exploded = useEngineStore((state) => state.exploded);
  const rgbMode = useEngineStore((state) => state.rgbMode);
  const selectedComponent = useEngineStore((state) => state.selectedComponent);
  const replacementRequest = useEngineStore((state) => state.replacementRequest);

  const spinningFans = collectSpinningFans(manager.root);

  useFrame((_, delta) => {
    const speed = profile.id === "mobile" ? 1.25 : 2.2;
    for (const fan of spinningFans) {
      fan.rotation.z -= delta * speed;
    }
  });

  useEffect(() => {
    configureSceneLod(manager.root, profile);
  }, [manager, profile]);

  useEffect(() => {
    void playExplosionAnimation(manager.list(), exploded, reducedMotion);
  }, [exploded, manager, reducedMotion]);

  useEffect(() => {
    if (selectedComponent === null) {
      selection.clear();
    }
  }, [selectedComponent, selection]);

  useEffect(() => {
    const color =
      rgbMode === "violet"
        ? materialTokens.violet
        : rgbMode === "magenta"
          ? materialTokens.magenta
          : rgbMode === "off"
            ? materialTokens.darkMetal
            : materialTokens.cyan;
    setRgbColor(manager.root, color, rgbMode === "off" ? 0 : 1.8);
  }, [manager, rgbMode]);

  useEffect(() => {
    const request = replacementRequest;
    if (request === null || runningRequest.current === request.requestId) {
      return;
    }

    const manifest = findManifest(request.assetId);
    if (manifest === undefined) {
      engineStore.getState().setReplacementState({
        phase: "failed",
        slot: request.slot,
        assetId: request.assetId,
        message: "Demo model manifest was not found.",
      });
      engineStore.getState().completeReplacement(request.requestId);
      return;
    }

    runningRequest.current = request.requestId;
    let previous: SceneComponent | undefined;
    let previousTransform: StoredComponentTransform | undefined;

    const replacementManager = new ComponentReplacementManager(
      {
        acquireCached: (assetId) => cache.acquire(assetId),
        load: async (assetId) => {
          engineStore.getState().setLoading({
            status: "loading",
            progress: 0.24,
            label: `Decoding ${manifest.url}`,
          });
          await waitForPlaceholderDecode();
          engineStore.getState().setLoading({
            status: "loading",
            progress: 0.78,
            label: "Preparing optimized scene graph",
          });

          const template = createPlaceholderComponent(
            request.slot,
            assetId,
            findVariant(assetId),
          ).object;
          cache.store(assetId, template, () => {
            disposeModelResources(template);
          });
          const instance = cache.acquire(assetId);
          if (instance === undefined) {
            throw new Error(`Placeholder model "${assetId}" was not cached.`);
          }
          engineStore.getState().setLoading({
            status: "placeholder",
            progress: 1,
            label: `${manifest.url} · procedural fallback`,
          });
          return instance;
        },
        removeCurrent: async (slot) => {
          previous = manager.get(slot);
          if (previous === undefined) {
            throw new Error(`No active ${slot.toUpperCase()} is installed.`);
          }
          previousTransform = readTransform(previous.object);
          selection.clear();
          engineStore.getState().selectComponent(null);
          await playRemovalAnimation(
            previous.object,
            {
              assembledPosition: previousTransform.position,
              assembledRotation: previousTransform.rotation,
              entryOffset: manifest.installation.entryOffset,
              durationMs: manifest.installation.durationMs,
            },
            reducedMotion,
          );
          manager.remove(slot);
        },
        install: async (_slot, model) => {
          const assembled = readTransform(model);
          model.name = `CMP_${request.slot.toUpperCase()}`;
          manager.root.add(model);
          await playInstallationAnimation(
            model,
            {
              assembledPosition: assembled.position,
              assembledRotation: assembled.rotation,
              entryOffset: manifest.installation.entryOffset,
              durationMs: manifest.installation.durationMs,
            },
            reducedMotion,
          );
        },
        commit: async (nextRequest, model) => {
          manager.replace({
            slot: nextRequest.slot,
            assetId: nextRequest.assetId,
            object: model,
          });
          engineStore.getState().commitHardware(nextRequest.slot, nextRequest.assetId);
          const activeRgbMode = engineStore.getState().rgbMode;
          const activeRgbColor =
            activeRgbMode === "violet"
              ? materialTokens.violet
              : activeRgbMode === "magenta"
                ? materialTokens.magenta
                : activeRgbMode === "off"
                  ? materialTokens.darkMetal
                  : materialTokens.cyan;
          setRgbColor(manager.root, activeRgbColor, activeRgbMode === "off" ? 0 : 1.8);
          configureSceneLod(manager.root, profile);
          setComponentRevision((revision) => revision + 1);
        },
        rollback: async (_slot, candidate) => {
          candidate?.removeFromParent();
          cache.release(request.assetId);
          if (previous !== undefined && previousTransform !== undefined) {
            restoreTransform(previous.object, previousTransform);
            manager.register(previous);
          }
        },
        releaseCurrent: (_slot: ReplacementSlot) => {
          if (previous === undefined) {
            return;
          }
          if (!cache.release(previous.assetId)) {
            disposeModelResources(previous.object);
          }
        },
      },
      (state) => {
        engineStore.getState().setReplacementState(state);
      },
    );

    void replacementManager
      .replace({
        slot: request.slot,
        assetId: request.assetId,
        modelUrl: request.modelUrl,
      })
      .finally(() => {
        runningRequest.current = null;
        engineStore.getState().completeReplacement(request.requestId);
      });
  }, [cache, manager, profile, reducedMotion, replacementRequest, selection]);

  useEffect(
    () => () => {
      selection.clear();
      for (const component of manager.clear()) {
        if (!cache.release(component.assetId)) {
          disposeModelResources(component.object);
        }
      }
      cache.clearUnused();
    },
    [cache, manager, selection],
  );

  const handleSelection = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    const result = resolveSelection(event.object);
    if (result === undefined) {
      return;
    }
    selection.select(result.root);
    engineStore.getState().selectComponent(result.componentType);
  };

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: WebGL selection is mirrored in the application telemetry. */}
      <primitive object={manager.root} onClick={handleSelection} />
      <Sparkles
        color={materialTokens.cyan}
        count={profile.id === "mobile" ? 26 : 72}
        opacity={0.42}
        scale={[11, 7, 11]}
        size={profile.id === "mobile" ? 1 : 1.5}
        speed={reducedMotion ? 0 : 0.16}
      />
    </>
  );
}
