"use client";

import { useMemo } from "react";
import { createFans } from "../components/Fans";
import { normalizeProceduralPart, PartGroup } from "./PartGroup";

type FansProps = {
  readonly selected: boolean;
};

export function Fans({ selected }: FansProps) {
  const object = useMemo(() => normalizeProceduralPart(createFans()), []);
  return (
    <PartGroup
      assetId="fans-rgb-120-triple"
      object={object}
      selected={selected}
      slotId="fan_mount"
    />
  );
}
