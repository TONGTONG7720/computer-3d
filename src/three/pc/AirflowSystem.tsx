"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, type BufferAttribute } from "three";
import { materialTokens } from "../materials/materialTokens";
import type { Vector3Tuple } from "../models/modelManifest";

export type AirflowPath = {
  readonly end: Vector3Tuple;
  readonly id: string;
  readonly kind: "intake" | "exhaust";
  readonly start: Vector3Tuple;
};

export const airflowPaths = [
  { id: "front-left", kind: "intake", start: [-1.2, 0.8, 2.8], end: [-0.8, 2.65, -0.4] },
  { id: "front-right", kind: "intake", start: [1.15, 0.8, 2.8], end: [0.65, 2.8, -0.55] },
  { id: "cpu-top", kind: "exhaust", start: [-0.55, 2.8, -0.5], end: [-0.8, 5.2, -1.85] },
  { id: "gpu-rear", kind: "exhaust", start: [0.75, 2.4, -0.1], end: [1.55, 4.8, -1.9] },
] as const satisfies readonly AirflowPath[];

export const getAirflowParticleBudget = (mobile: boolean): number => (mobile ? 48 : 144);

export const sampleAirflowPath = (path: AirflowPath, progress: number): Vector3Tuple => {
  if (progress <= 0) {
    return path.start;
  }
  if (progress >= 1) {
    return path.end;
  }
  const eased = progress * progress * (3 - 2 * progress);
  return [
    path.start[0] + (path.end[0] - path.start[0]) * eased,
    path.start[1] + (path.end[1] - path.start[1]) * eased,
    path.start[2] + (path.end[2] - path.start[2]) * eased,
  ];
};

type AirflowStreamProps = {
  readonly count: number;
  readonly path: AirflowPath;
  readonly speed: number;
};

function AirflowStream({ count, path, speed }: AirflowStreamProps) {
  const attributeRef = useRef<BufferAttribute>(null);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime() * speed;
    for (let index = 0; index < count; index += 1) {
      const progress = (index / count + elapsed) % 1;
      const point = sampleAirflowPath(path, progress);
      const offset = index * 3;
      positions[offset] = point[0];
      positions[offset + 1] = point[1];
      positions[offset + 2] = point[2];
    }
    if (attributeRef.current !== null) {
      attributeRef.current.needsUpdate = true;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} ref={attributeRef} />
      </bufferGeometry>
      <pointsMaterial
        blending={AdditiveBlending}
        color={path.kind === "intake" ? materialTokens.coldBlue : materialTokens.heatRed}
        depthWrite={false}
        opacity={0.68}
        size={0.075}
        sizeAttenuation
        transparent
      />
    </points>
  );
}

type AirflowSystemProps = {
  readonly mobile: boolean;
};

export function AirflowSystem({ mobile }: AirflowSystemProps) {
  const total = getAirflowParticleBudget(mobile);
  const count = Math.floor(total / airflowPaths.length);
  return (
    <group name="AIRFLOW_SIMULATION">
      {airflowPaths.map((path) => (
        <AirflowStream count={count} key={path.id} path={path} speed={0.17} />
      ))}
    </group>
  );
}
