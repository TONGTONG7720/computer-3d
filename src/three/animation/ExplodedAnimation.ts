import gsap from "gsap";
import type { Group } from "three";
import type { Vector3Tuple } from "../models/modelManifest";
import { getComponentSlot, type PCSlotId } from "../pc/slots";

export type ExplodedTransform = {
  readonly position: Vector3Tuple;
  readonly rotation: Vector3Tuple;
};

export const createExplodedTransform = (slotId: PCSlotId, exploded: boolean): ExplodedTransform => {
  const slot = getComponentSlot(slotId);
  const position: Vector3Tuple = exploded
    ? [
        slot.position[0] + slot.explodedOffset[0],
        slot.position[1] + slot.explodedOffset[1],
        slot.position[2] + slot.explodedOffset[2],
      ]
    : slot.position;
  const rotation: Vector3Tuple = exploded
    ? [
        slot.rotation[0] + slot.explodedOffset[1] * 0.035,
        slot.rotation[1] + slot.explodedOffset[0] * 0.025,
        slot.rotation[2],
      ]
    : slot.rotation;
  return { position, rotation };
};

export const playExplodedAnimation = (
  group: Group,
  slotId: PCSlotId,
  exploded: boolean,
  reducedMotion: boolean,
): void => {
  const target = createExplodedTransform(slotId, exploded);
  gsap.killTweensOf(group.position);
  gsap.killTweensOf(group.rotation);
  if (reducedMotion) {
    group.position.set(...target.position);
    group.rotation.set(...target.rotation);
    return;
  }
  gsap.to(group.position, {
    x: target.position[0],
    y: target.position[1],
    z: target.position[2],
    duration: 0.9,
    ease: "power3.out",
  });
  gsap.to(group.rotation, {
    x: target.rotation[0],
    y: target.rotation[1],
    z: target.rotation[2],
    duration: 0.9,
    ease: "power3.out",
  });
};
