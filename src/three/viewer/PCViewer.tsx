"use client";

import { Html } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { engineStore } from "@/store/engineStore";
import { CameraController } from "../core/CameraController";
import { LightingSystem } from "../core/LightingSystem";
import { type QualityProfile, selectQualityProfile } from "../core/QualityManager";
import { DragController } from "../interaction/DragController";
import { PCScene } from "./PCScene";
import styles from "./PCViewer.module.css";

type ViewerEnvironment = {
  readonly profile: QualityProfile;
  readonly reducedMotion: boolean;
};

const readEnvironment = (): ViewerEnvironment => {
  if (typeof window === "undefined") {
    return {
      profile: selectQualityProfile({
        viewportWidth: 1440,
        devicePixelRatio: 1,
        reducedMotion: false,
      }),
      reducedMotion: false,
    };
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    profile: selectQualityProfile({
      viewportWidth: window.innerWidth,
      devicePixelRatio: window.devicePixelRatio,
      reducedMotion,
    }),
    reducedMotion,
  };
};

const useViewerEnvironment = (): ViewerEnvironment => {
  const [environment, setEnvironment] = useState(readEnvironment);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (): void => setEnvironment(readEnvironment());
    window.addEventListener("resize", update);
    media.addEventListener("change", update);
    return () => {
      window.removeEventListener("resize", update);
      media.removeEventListener("change", update);
    };
  }, []);

  return environment;
};

function SceneLoader() {
  return (
    <Html center>
      <div aria-live="polite" className={styles["loader"]}>
        Initializing 3D engine
      </div>
    </Html>
  );
}

export function PCViewer() {
  const { profile, reducedMotion } = useViewerEnvironment();

  return (
    <div
      aria-label="PC LAB interactive 3D computer viewer"
      className={styles["viewer"]}
      onContextMenu={(event) => event.preventDefault()}
      role="application"
    >
      <Canvas
        camera={{
          far: 80,
          fov: profile.id === "mobile" ? 38 : 34,
          near: 0.1,
          position: [8.2, 6.35, 9.4],
        }}
        dpr={[1, profile.maxDpr]}
        fallback={
          <div className={styles["canvasFallback"]}>
            WebGL unavailable. Enable hardware acceleration to open the PC model.
          </div>
        }
        gl={{
          alpha: true,
          antialias: profile.antialias,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearAlpha(0);
          engineStore.getState().setLoading({
            status: "placeholder",
            progress: 1,
            label: `${profile.id} · procedural GLB fallback`,
          });
        }}
        onPointerMissed={() => {
          engineStore.getState().selectComponent(null);
        }}
        shadows={profile.shadows}
      >
        <Suspense fallback={<SceneLoader />}>
          <LightingSystem profile={profile} />
          <PCScene profile={profile} reducedMotion={reducedMotion} />
        </Suspense>
        <CameraController mobile={profile.id === "mobile"} reducedMotion={reducedMotion} />
        <DragController mobile={profile.id === "mobile"} />
      </Canvas>
    </div>
  );
}
