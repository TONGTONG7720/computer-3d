import { Group } from "three";
import {
  createMetalMaterial,
  createPlasticMaterial,
  materialTokens,
} from "../materials/MaterialSystem";
import { createBox } from "./geometry";

type CpuAppearance = {
  readonly accent?: number;
};

export const createCPU = (appearance: CpuAppearance = {}): Group => {
  const group = new Group();
  group.name = "CMP_CPU";
  group.position.set(-0.35, 3.05, -1.58);

  const substrate = createPlasticMaterial(materialTokens.pcbBlack);
  const heatSpreader = createMetalMaterial(appearance.accent ?? materialTokens.brushedAluminum);

  group.add(createBox("GEO_CPU_SUBSTRATE", [0.78, 0.78, 0.08], [0, 0, 0], substrate));
  group.add(createBox("GEO_CPU_IHS", [0.63, 0.63, 0.1], [0, 0, 0.08], heatSpreader));
  return group;
};
