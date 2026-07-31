import { Group } from "three";
import {
  createMetalMaterial,
  createPlasticMaterial,
  createRgbMaterial,
  materialTokens,
} from "../materials/MaterialSystem";
import { createFanModule } from "./geometry";

export const createFans = (): Group => {
  const group = new Group();
  group.name = "CMP_FAN";
  group.position.set(0, 2.45, 1.83);

  const frame = createMetalMaterial(materialTokens.darkMetal);
  const blade = createPlasticMaterial();
  const rgb = createRgbMaterial(materialTokens.magenta);

  for (let index = 0; index < 3; index += 1) {
    group.add(
      createFanModule(
        `GEO_CASE_FAN_0${index + 1}`,
        0.52,
        [0, -1.15 + index * 1.15, 0],
        frame,
        blade,
        rgb,
      ),
    );
  }
  return group;
};
