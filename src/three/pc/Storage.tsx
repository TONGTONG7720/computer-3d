"use client";

import { useMemo } from "react";
import type { StorageHardware } from "@/features/builder/domain/hardware";
import { createStorage } from "../components/Storage";
import type { ScenePart } from "./BuilderSceneSelection";
import { normalizeProceduralPart, PartGroup } from "./PartGroup";

type StorageProps = {
  readonly part: ScenePart<StorageHardware>;
  readonly selected: boolean;
};

export function Storage({ part, selected }: StorageProps) {
  const object = useMemo(() => normalizeProceduralPart(createStorage()), []);
  return (
    <PartGroup
      assetId={part.hardware.id}
      object={object}
      selected={selected}
      slotId="storage_slots"
    />
  );
}
