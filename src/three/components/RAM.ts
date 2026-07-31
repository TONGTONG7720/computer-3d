import { Group } from "three";
import {
  createMetalMaterial,
  createPcbMaterial,
  createRgbMaterial,
  materialTokens,
} from "../materials/MaterialSystem";
import { createBox } from "./geometry";

export const createRAM = (): Group => {
  const group = new Group();
  group.name = "CMP_RAM";
  group.position.set(0.66, 3.34, -1.5);

  const pcb = createPcbMaterial();
  const metal = createMetalMaterial(materialTokens.graphiteMetal);
  const rgb = createRgbMaterial(materialTokens.violet);

  for (let index = 0; index < 4; index += 1) {
    const x = index * 0.18;
    group.add(createBox(`GEO_RAM_PCB_0${index + 1}`, [0.1, 1.18, 0.32], [x, 0, 0], pcb));
    group.add(createBox(`GEO_RAM_HEATSINK_0${index + 1}`, [0.12, 1.02, 0.35], [x, 0, 0], metal));
    group.add(createBox(`RGB_RAM_0${index + 1}`, [0.13, 0.05, 0.36], [x, 0.54, 0], rgb));
  }
  return group;
};
