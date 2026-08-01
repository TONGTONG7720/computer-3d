"use client";

import { useMemo } from "react";
import type { CpuHardware } from "@/features/builder/domain/hardware";
import { createCPU } from "../components/CPU";
import { materialTokens } from "../materials/materialTokens";
import type { ScenePart } from "./BuilderSceneSelection";
import { normalizeProceduralPart, PartGroup } from "./PartGroup";

type CPUProps = {
  readonly part: ScenePart<CpuHardware>;
  readonly selected: boolean;
};

export function CPU({ part, selected }: CPUProps) {
  const accent = part.hardware.modelVariant.startsWith("amd")
    ? materialTokens.copper
    : materialTokens.brushedAluminum;
  const object = useMemo(() => normalizeProceduralPart(createCPU({ accent })), [accent]);
  return (
    <PartGroup assetId={part.hardware.id} object={object} selected={selected} slotId="cpu_socket" />
  );
}
