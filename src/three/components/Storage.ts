import { Group } from "three";
import {
  createMetalMaterial,
  createPcbMaterial,
  materialTokens,
} from "../materials/MaterialSystem";
import { createBox } from "./geometry";

export const createStorage = (): Group => {
  const group = new Group();
  group.name = "CMP_STORAGE";
  group.position.set(0.2, 1.7, -1.45);

  const pcb = createPcbMaterial();
  const metal = createMetalMaterial(materialTokens.graphiteMetal);
  group.add(createBox("GEO_STORAGE_PCB", [1.45, 0.26, 0.05], [0, 0, 0], pcb));
  group.add(createBox("GEO_STORAGE_HEATSINK", [1.25, 0.3, 0.1], [0, 0, 0.07], metal));
  return group;
};
