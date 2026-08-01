"use client";

import { AdaptiveDpr, Html } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useMemo, useState } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import type { SelectedComponents } from "@/features/builder/domain/hardware";
import type { CameraView } from "../animation/CameraAnimation";
import { CameraSystem } from "../core/CameraSystem";
import type { ViewerMode, ViewerRuntimeStatus } from "../core/engineTypes";
import { LightingSystem } from "../core/LightingSystem";
import { useViewerEnvironment } from "../core/useViewerEnvironment";
import { getViewerShadowMapType, shouldRenderContinuously } from "../core/ViewerRuntime";
import { OrbitController } from "../interaction/OrbitController";
import type { RGBSettings } from "../materials/RGBSettings";
import { RGBSystem } from "../materials/RGBSystem";
import { AirflowSystem } from "../pc/AirflowSystem";
import { createBuilderSceneSelection } from "../pc/BuilderSceneSelection";
import { PCScene } from "../pc/PCScene";
import type { PCSlotId } from "../pc/slots";
import styles from "./BuilderPCViewer.module.css";

type BuilderPCViewerProps = {
  readonly cameraRevision: number;
  readonly cameraView: CameraView;
  readonly mode: ViewerMode;
  readonly onSelect: (slotId: PCSlotId | null) => void;
  readonly onStatus: (status: ViewerRuntimeStatus) => void;
  readonly rgbSettings: RGBSettings;
  readonly selectedComponents: SelectedComponents;
  readonly selectedSlot: PCSlotId | null;
};

function SceneLoader() {
  return (
    <Html center>
      <div className={styles["loader"]} role="status">
        <span aria-hidden="true" />
        Preparing PC assembly
      </div>
    </Html>
  );
}

export function BuilderPCViewer({
  cameraRevision,
  cameraView,
  mode,
  onSelect,
  onStatus,
  rgbSettings,
  selectedComponents,
  selectedSlot,
}: BuilderPCViewerProps) {
  const { profile, reducedMotion } = useViewerEnvironment();
  const [installingSlots, setInstallingSlots] = useState<readonly PCSlotId[]>([]);
  const sceneSelection = useMemo(
    () => createBuilderSceneSelection(selectedComponents),
    [selectedComponents],
  );
  const cameraTarget = useMemo(
    () => (cameraView === "exploded" ? ([0.25, 2.7, 0.1] as const) : ([0, 2.45, 0] as const)),
    [cameraView],
  );
  const handleInstallationChange = useCallback(
    (slotId: PCSlotId, active: boolean): void => {
      setInstallingSlots((current) => {
        const filtered = current.filter((currentSlot) => currentSlot !== slotId);
        return active ? [...filtered, slotId] : filtered;
      });
      onStatus(
        active
          ? { kind: "loading", label: `Installing ${slotId}`, progress: 0.72 }
          : { kind: "ready", label: `${profile.id} · component locked` },
      );
    },
    [onStatus, profile.id],
  );
  const effectiveCameraView = installingSlots.length > 0 ? "installation" : cameraView;

  return (
    <div
      aria-label="PC LAB interactive 3D computer viewer"
      className={styles["viewer"]}
      onContextMenu={(event) => event.preventDefault()}
      role="application"
    >
      <Canvas
        camera={{ far: 80, fov: 34, near: 0.1, position: [8.2, 6.35, 9.4] }}
        dpr={[1, profile.maxDpr]}
        fallback={<div className={styles["fallback"]}>WebGL unavailable</div>}
        flat={false}
        frameloop={shouldRenderContinuously(mode, rgbSettings.effect) ? "always" : "demand"}
        gl={{ alpha: true, antialias: profile.antialias, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = SRGBColorSpace;
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          gl.setClearAlpha(0);
          onStatus({ kind: "ready", label: `${profile.id} · modular PC scene` });
        }}
        onPointerMissed={() => onSelect(null)}
        performance={{ debounce: 220, max: 1, min: 0.62 }}
        shadows={profile.shadows ? { type: getViewerShadowMapType() } : false}
      >
        <Suspense fallback={<SceneLoader />}>
          <LightingSystem profile={profile} />
          <PCScene
            mode={mode}
            onInstallationChange={handleInstallationChange}
            onSelect={onSelect}
            reducedMotion={reducedMotion}
            selectedSlot={selectedSlot}
            selection={sceneSelection}
          />
          {mode === "airflow" ? <AirflowSystem mobile={profile.id === "mobile"} /> : null}
          <RGBSystem active={mode === "studio"} settings={rgbSettings} />
        </Suspense>
        <CameraSystem
          mobile={profile.id === "mobile"}
          reducedMotion={reducedMotion}
          revision={cameraRevision}
          view={effectiveCameraView}
        />
        <OrbitController mobile={profile.id === "mobile"} target={cameraTarget} />
        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}
