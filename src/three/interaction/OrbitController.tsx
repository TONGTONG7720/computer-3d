"use client";

import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { MOUSE, TOUCH } from "three";
import type { Vector3Tuple } from "../models/modelManifest";

export type OrbitLimits = {
  readonly minDistance: number;
  readonly maxDistance: number;
  readonly minPolarAngle: number;
  readonly maxPolarAngle: number;
};

export const getOrbitLimits = (mobile: boolean): OrbitLimits => ({
  minDistance: mobile ? 7.2 : 4.8,
  maxDistance: mobile ? 24 : 18,
  minPolarAngle: 0.35,
  maxPolarAngle: 2.16,
});

type OrbitControllerProps = {
  readonly mobile: boolean;
  readonly target: Vector3Tuple;
};

export function OrbitController({ mobile, target }: OrbitControllerProps) {
  const regress = useThree((state) => state.performance.regress);
  const limits = getOrbitLimits(mobile);

  return (
    <OrbitControls
      dampingFactor={0.075}
      enableDamping
      enablePan
      makeDefault
      maxDistance={limits.maxDistance}
      maxPolarAngle={limits.maxPolarAngle}
      minDistance={limits.minDistance}
      minPolarAngle={limits.minPolarAngle}
      mouseButtons={{
        LEFT: MOUSE.ROTATE,
        MIDDLE: MOUSE.DOLLY,
        RIGHT: MOUSE.PAN,
      }}
      onChange={regress}
      screenSpacePanning
      target={target}
      touches={{
        ONE: TOUCH.ROTATE,
        TWO: TOUCH.DOLLY_PAN,
      }}
      zoomToCursor
    />
  );
}
