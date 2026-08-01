"use client";

import { useMemo } from "react";
import type { PsuHardware } from "@/features/builder/domain/hardware";
import { createPowerSupply } from "../components/PowerSupply";
import type { ScenePart } from "./BuilderSceneSelection";
import { normalizeProceduralPart, PartGroup } from "./PartGroup";

type PowerSupplyProps = {
  readonly part: ScenePart<PsuHardware>;
  readonly selected: boolean;
};

export function PowerSupply({ part, selected }: PowerSupplyProps) {
  const object = useMemo(() => normalizeProceduralPart(createPowerSupply()), []);
  return (
    <PartGroup assetId={part.hardware.id} object={object} selected={selected} slotId="psu_area" />
  );
}
