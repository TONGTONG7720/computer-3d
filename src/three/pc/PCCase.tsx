"use client";

import { useMemo } from "react";
import type { CaseHardware } from "@/features/builder/domain/hardware";
import { createPCCase } from "../components/PCCase";
import type { ScenePart } from "./BuilderSceneSelection";
import { normalizeProceduralPart, PartGroup } from "./PartGroup";

type PCCaseProps = {
  readonly part: ScenePart<CaseHardware>;
  readonly selected: boolean;
};

export function PCCase({ part, selected }: PCCaseProps) {
  const object = useMemo(() => normalizeProceduralPart(createPCCase()), []);
  return (
    <PartGroup assetId={part.hardware.id} object={object} selected={selected} slotId="pc_case" />
  );
}
