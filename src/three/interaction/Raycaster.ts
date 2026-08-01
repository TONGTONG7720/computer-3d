import type { Object3D } from "three";
import type { PCSlotId } from "../pc/slots";

export type RaycastHit = {
  readonly distance: number;
  readonly object: Object3D;
};

const parseSlotId = (input: unknown): PCSlotId | undefined => {
  switch (input) {
    case "pc_case":
    case "motherboard":
    case "cpu_socket":
    case "gpu_slot":
    case "ram_slots":
    case "storage_slots":
    case "cooling_mount":
    case "fan_mount":
    case "psu_area":
      return input;
    default:
      return undefined;
  }
};

const findParentSlot = (object: Object3D): PCSlotId | undefined => {
  let candidate: Object3D | null = object;
  while (candidate !== null) {
    const slotId = parseSlotId(candidate.userData["slotId"]);
    if (slotId !== undefined) {
      return slotId;
    }
    candidate = candidate.parent;
  }
  return undefined;
};

export const resolveRaycastSlot = (hits: readonly RaycastHit[]): PCSlotId | undefined => {
  let nearestDistance = Number.POSITIVE_INFINITY;
  let nearestSlot: PCSlotId | undefined;
  for (const hit of hits) {
    const slotId = findParentSlot(hit.object);
    if (slotId !== undefined && hit.distance < nearestDistance) {
      nearestDistance = hit.distance;
      nearestSlot = slotId;
    }
  }
  return nearestSlot;
};
