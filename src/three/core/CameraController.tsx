"use client";

import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect } from "react";
import { useEngineStore } from "@/store/engineStore";

const overviewPosition = [8.2, 6.35, 9.4] as const;
const internalPosition = [5.25, 4.35, 5.35] as const;
const mobileOverviewPosition = [13.8, 8.4, 17.2] as const;
const mobileInternalPosition = [8.8, 5.3, 9.2] as const;
const explodedPosition = [10.4, 7.2, 12.6] as const;
const mobileExplodedPosition = [18, 11, 22.5] as const;
const cameraTarget = [0, 2.45, 0] as const;

type CameraControllerProps = {
  readonly mobile: boolean;
  readonly reducedMotion: boolean;
};

export function CameraController({ mobile, reducedMotion }: CameraControllerProps) {
  const camera = useThree((state) => state.camera);
  const cameraRevision = useEngineStore((state) => state.cameraRevision);
  const cameraMode = useEngineStore((state) => state.cameraMode);
  const exploded = useEngineStore((state) => state.exploded);

  useEffect(() => {
    camera.userData["cameraRevision"] = cameraRevision;
    const destination = exploded
      ? mobile
        ? mobileExplodedPosition
        : explodedPosition
      : cameraMode === "internal"
        ? mobile
          ? mobileInternalPosition
          : internalPosition
        : mobile
          ? mobileOverviewPosition
          : overviewPosition;
    const tween = gsap.to(camera.position, {
      x: destination[0],
      y: destination[1],
      z: destination[2],
      duration: reducedMotion ? 0 : 0.8,
      ease: "power3.out",
      onUpdate: () => camera.lookAt(...cameraTarget),
      onComplete: () => camera.lookAt(...cameraTarget),
    });

    return () => {
      tween.kill();
    };
  }, [camera, cameraMode, cameraRevision, exploded, mobile, reducedMotion]);

  return null;
}
