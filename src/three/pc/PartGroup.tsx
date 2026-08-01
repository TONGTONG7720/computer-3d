"use client";

import { useEffect } from "react";
import type { Group } from "three";
import { materialTokens } from "../materials/materialTokens";
import { disposeModelResources } from "../models/ModelLoader";
import { getComponentSlot, type PCSlotId } from "./slots";

export const normalizeProceduralPart = (part: Group): Group => {
  part.position.set(0, 0, 0);
  part.rotation.set(0, 0, 0);
  part.scale.set(1, 1, 1);
  return part;
};

export type PartGroupProps = {
  readonly assetId: string;
  readonly object: Group;
  readonly selected: boolean;
  readonly slotId: PCSlotId;
};

export function PartGroup({ assetId, object, selected, slotId }: PartGroupProps) {
  const slot = getComponentSlot(slotId);
  object.userData["assetId"] = assetId;
  object.userData["slotId"] = slotId;

  useEffect(
    () => () => {
      disposeModelResources(object);
    },
    [object],
  );

  return (
    <group
      name={`SLOT_${slotId.toUpperCase()}`}
      position={slot.position}
      rotation={slot.rotation}
      scale={slot.scale}
      userData={{ assetId, slotId }}
    >
      <primitive dispose={null} object={object} />
      {selected ? <boxHelper args={[object, materialTokens.selected]} /> : null}
    </group>
  );
}
