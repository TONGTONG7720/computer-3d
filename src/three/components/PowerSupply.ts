import { Group } from "three";
import {
  createMetalMaterial,
  createPlasticMaterial,
  materialTokens,
} from "../materials/MaterialSystem";
import { createBox, createFanModule } from "./geometry";

export const createPowerSupply = (): Group => {
  const group = new Group();
  group.name = "CMP_POWER_SUPPLY";
  group.position.set(-0.5, 0.65, 0.8);

  const metal = createMetalMaterial(materialTokens.darkMetal);
  const plastic = createPlasticMaterial();
  group.add(createBox("GEO_PSU_BODY", [1.75, 0.85, 1.65], [0, 0, 0], metal));
  group.add(
    createFanModule(
      "GEO_PSU_FAN",
      0.44,
      [0, 0, 0.84],
      metal,
      plastic,
      createMetalMaterial(materialTokens.graphiteMetal),
    ),
  );
  return group;
};
