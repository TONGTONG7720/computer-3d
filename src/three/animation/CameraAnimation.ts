import type { Vector3Tuple } from "../models/modelManifest";

export const cameraViews = ["default", "detail", "exploded", "installation"] as const;
export type CameraView = (typeof cameraViews)[number];

export type CameraPreset = {
  readonly position: Vector3Tuple;
  readonly target: Vector3Tuple;
  readonly fov: number;
};

export const cameraPresets = {
  default: {
    position: [8.2, 6.35, 9.4],
    target: [0, 2.45, 0],
    fov: 34,
  },
  detail: {
    position: [5.25, 4.35, 5.35],
    target: [0, 2.75, -0.7],
    fov: 32,
  },
  exploded: {
    position: [10.8, 7.5, 13.2],
    target: [0.25, 2.7, 0.1],
    fov: 36,
  },
  installation: {
    position: [5.8, 4.9, 6.6],
    target: [0.2, 2.65, -0.45],
    fov: 32,
  },
} as const satisfies Readonly<Record<CameraView, CameraPreset>>;

export const getCameraPreset = (view: CameraView): CameraPreset => cameraPresets[view];
