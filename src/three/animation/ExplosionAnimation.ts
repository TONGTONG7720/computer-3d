import gsap from "gsap";
import type { Group } from "three";
import type { SceneComponent } from "../core/SceneManager";
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

type StoredTransform = {
  readonly position: Vector3Tuple;
  readonly rotation: Vector3Tuple;
};

const assembledTransforms = new WeakMap<Group, StoredTransform>();

const rememberAssembledTransform = (object: Group): StoredTransform => {
  const existing = assembledTransforms.get(object);
  if (existing !== undefined) {
    return existing;
  }

  const transform: StoredTransform = {
    position: [object.position.x, object.position.y, object.position.z],
    rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
  };
  assembledTransforms.set(object, transform);
  return transform;
};

export const playExplosionAnimation = (
  components: readonly SceneComponent[],
  exploded: boolean,
  reducedMotion: boolean,
): Promise<void> => {
  const animations: Promise<void>[] = [];

  for (const component of components) {
    const assembled = rememberAssembledTransform(component.object);
    const offset = getExplosionTransform(component.slot);
    const targetPosition: Vector3Tuple = exploded
      ? [
          assembled.position[0] + offset.position[0],
          assembled.position[1] + offset.position[1],
          assembled.position[2] + offset.position[2],
        ]
      : assembled.position;
    const targetRotation: Vector3Tuple = exploded
      ? [
          assembled.rotation[0] + offset.rotation[0],
          assembled.rotation[1] + offset.rotation[1],
          assembled.rotation[2] + offset.rotation[2],
        ]
      : assembled.rotation;

    gsap.killTweensOf(component.object.position);
    gsap.killTweensOf(component.object.rotation);

    if (reducedMotion) {
      component.object.position.set(...targetPosition);
      component.object.rotation.set(...targetRotation);
      continue;
    }

    animations.push(
      new Promise((resolve) => {
        gsap.to(component.object.position, {
          x: targetPosition[0],
          y: targetPosition[1],
          z: targetPosition[2],
          duration: 0.9,
          delay: component.slot === "case" ? 0 : 0.035,
          ease: "power3.out",
          onComplete: resolve,
        });
        gsap.to(component.object.rotation, {
          x: targetRotation[0],
          y: targetRotation[1],
          z: targetRotation[2],
          duration: 0.9,
          ease: "power3.out",
        });
      }),
    );
  }

  return Promise.all(animations).then(() => undefined);
};
