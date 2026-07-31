import { Group } from "three";
import {
  createMetalMaterial,
  createPcbMaterial,
  createPlasticMaterial,
  materialTokens,
} from "../materials/MaterialSystem";
import { createBox } from "./geometry";

export const createMotherboard = (): Group => {
  const group = new Group();
  group.name = "CMP_MOTHERBOARD";
  group.position.set(-0.15, 2.7, -1.72);

  const pcb = createPcbMaterial();
  const metal = createMetalMaterial(materialTokens.brushedAluminum);
  const dark = createPlasticMaterial(materialTokens.pcbBlack);

  group.add(createBox("GEO_MB_PCB", [2.55, 3.25, 0.08], [0, 0, 0], pcb));
  group.add(createBox("GEO_MB_VRM_TOP", [1.35, 0.28, 0.16], [-0.2, 1.32, 0.1], metal));
  group.add(createBox("GEO_MB_VRM_SIDE", [0.28, 1.2, 0.16], [-1.02, 0.65, 0.1], metal));
  group.add(createBox("GEO_MB_CHIPSET", [0.62, 0.62, 0.16], [0.65, -0.85, 0.1], metal));
  group.add(createBox("GEO_MB_PCIE", [1.8, 0.08, 0.12], [0.15, -0.35, 0.12], dark));
  group.add(createBox("GEO_MB_IO", [0.34, 1.1, 0.32], [-1.12, 0.8, 0.1], dark));

  return group;
};
