"use client";

import { useMemo } from "react";
import type { RamHardware } from "@/features/builder/domain/hardware";
import { createRAM } from "../components/RAM";
import type { ScenePart } from "./BuilderSceneSelection";
import { normalizeProceduralPart, PartGroup } from "./PartGroup";

type RAMProps = {
  readonly part: ScenePart<RamHardware>;
  readonly selected: boolean;
};

export function RAM({ part, selected }: RAMProps) {
  const object = useMemo(() => normalizeProceduralPart(createRAM()), []);
  return (
    <PartGroup assetId={part.hardware.id} object={object} selected={selected} slotId="ram_slots" />
  );
}
