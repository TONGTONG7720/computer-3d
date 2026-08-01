"use client";

import { useMemo } from "react";
import type { CoolingHardware } from "@/features/builder/domain/hardware";
import { createCooling } from "../components/Cooling";
import type { ScenePart } from "./BuilderSceneSelection";
import { normalizeProceduralPart, PartGroup } from "./PartGroup";

type CoolingProps = {
  readonly part: ScenePart<CoolingHardware>;
  readonly selected: boolean;
};

export function Cooling({ part, selected }: CoolingProps) {
  const object = useMemo(() => normalizeProceduralPart(createCooling()), []);
  return (
    <PartGroup
      assetId={part.hardware.id}
      object={object}
      selected={selected}
      slotId="cooling_mount"
    />
  );
}
