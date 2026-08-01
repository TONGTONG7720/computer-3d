"use client";

import { useMemo } from "react";
import type { GpuHardware } from "@/features/builder/domain/hardware";
import { createGPU } from "../components/GPU";
import { materialTokens } from "../materials/materialTokens";
import type { ScenePart } from "./BuilderSceneSelection";
import { normalizeProceduralPart, PartGroup } from "./PartGroup";

type GPUProps = {
  readonly part: ScenePart<GpuHardware>;
  readonly selected: boolean;
};

const resolveGpuAppearance = (variant: string) => ({
  accent: variant.startsWith("rx")
    ? materialTokens.magenta
    : variant === "rtx5080"
      ? materialTokens.violet
      : materialTokens.cyan,
  body: variant.startsWith("rx") ? materialTokens.auroraBody : materialTokens.plasticBlack,
});

export function GPU({ part, selected }: GPUProps) {
  const variant = part.hardware.modelVariant;
  const object = useMemo(
    () => normalizeProceduralPart(createGPU(resolveGpuAppearance(variant))),
    [variant],
  );
  return (
    <PartGroup
      animateReplacement
      assetId={part.hardware.id}
      object={object}
      selected={selected}
      slotId="gpu_slot"
    />
  );
}
