"use client";

import { useMemo } from "react";
import type { MotherboardHardware } from "@/features/builder/domain/hardware";
import { createMotherboard } from "../components/Motherboard";
import type { ScenePart } from "./BuilderSceneSelection";
import { normalizeProceduralPart, PartGroup } from "./PartGroup";

type MotherboardProps = {
  readonly part: ScenePart<MotherboardHardware>;
  readonly selected: boolean;
};

export function Motherboard({ part, selected }: MotherboardProps) {
  const object = useMemo(() => normalizeProceduralPart(createMotherboard()), []);
  return (
    <PartGroup
      assetId={part.hardware.id}
      object={object}
      selected={selected}
      slotId="motherboard"
    />
  );
}
