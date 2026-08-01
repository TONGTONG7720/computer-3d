"use client";

import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect } from "react";
import { PerspectiveCamera } from "three";
import { type CameraView, getResponsiveCameraPreset } from "../animation/CameraAnimation";
import { applyPerspectiveFov } from "./CameraProjection";

type CameraSystemProps = {
  readonly mobile: boolean;
  readonly reducedMotion: boolean;
  readonly revision: number;
  readonly view: CameraView;
};

export function CameraSystem({ mobile, reducedMotion, revision, view }: CameraSystemProps) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const preset = getResponsiveCameraPreset(view, mobile);
    camera.userData["cameraRevision"] = revision;
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(camera);

    const update = (): void => {
      camera.lookAt(...preset.target);
      if (camera instanceof PerspectiveCamera) {
        camera.updateProjectionMatrix();
      }
      invalidate();
    };

    if (reducedMotion) {
      camera.position.set(...preset.position);
      if (camera instanceof PerspectiveCamera) {
        applyPerspectiveFov(camera, preset.fov);
      }
      update();
      return;
    }

    gsap.to(camera.position, {
      x: preset.position[0],
      y: preset.position[1],
      z: preset.position[2],
      duration: 0.82,
      ease: "power3.out",
      onUpdate: update,
    });
    if (camera instanceof PerspectiveCamera) {
      gsap.to(camera, {
        fov: preset.fov,
        duration: 0.58,
        ease: "power2.out",
        onUpdate: update,
      });
    }

    return () => {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(camera);
    };
  }, [camera, invalidate, mobile, reducedMotion, revision, view]);

  return null;
}
