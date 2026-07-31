import type { ComponentType, Vector3Tuple } from "../models/modelManifest";

export type ExplosionTransform = {
  readonly position: Vector3Tuple;
  readonly rotation: Vector3Tuple;
};

const explosionTransforms = {
  case: {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  },
  motherboard: {
    position: [-0.8, 0.25, -0.65],
    rotation: [0, -0.12, -0.05],
  },
  cpu: {
    position: [-0.35, 0.8, 0.15],
    rotation: [0, 0, 0],
  },
  gpu: {
    position: [2.25, 0.35, 0.15],
    rotation: [0, 0.08, 0],
  },
  ram: {
    position: [0.65, 1.35, 0.1],
    rotation: [0, 0, 0.08],
  },
  storage: {
    position: [-1.45, -0.25, 0.1],
    rotation: [0, -0.08, 0],
  },
  cooling: {
    position: [0, 1.8, -0.15],
    rotation: [-0.08, 0, 0],
  },
  fan: {
    position: [0, 0.45, -1.5],
    rotation: [0.08, 0, 0],
  },
  power_supply: {
    position: [-1.1, -0.85, -0.25],
    rotation: [0, -0.08, 0],
  },
} as const satisfies Record<ComponentType, ExplosionTransform>;

export const getExplosionTransform = (componentType: ComponentType): ExplosionTransform =>
  explosionTransforms[componentType];
