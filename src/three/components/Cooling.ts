import { CatmullRomCurve3, Group, Mesh, TubeGeometry, Vector3 } from "three";
import {
  createMetalMaterial,
  createPlasticMaterial,
  createRgbMaterial,
  materialTokens,
} from "../materials/MaterialSystem";
import { createBox, createCylinder, createFanModule } from "./geometry";

export const createCooling = (): Group => {
  const group = new Group();
  group.name = "CMP_COOLING";
  group.position.set(0, 4.48, -0.15);

  const metal = createMetalMaterial(materialTokens.darkMetal);
  const plastic = createPlasticMaterial();
  const rgb = createRgbMaterial(materialTokens.cyan);

  group.add(createBox("GEO_COOLING_RADIATOR", [2.75, 0.25, 1.05], [0, 0, 0], metal));
  for (let index = 0; index < 3; index += 1) {
    group.add(
      createFanModule(
        `GEO_COOLING_FAN_0${index + 1}`,
        0.38,
        [-0.86 + index * 0.86, -0.15, 0],
        metal,
        plastic,
        rgb,
      ),
    );
  }

  const pump = createCylinder("GEO_COOLING_PUMP", 0.38, 0.2, [-0.35, -1.42, -1.25], metal);
  pump.add(createCylinder("RGB_COOLING_PUMP", 0.29, 0.22, [0, 0, 0], rgb));
  group.add(pump);

  const tubeCurve = new CatmullRomCurve3([
    new Vector3(-0.35, -1.42, -1.25),
    new Vector3(-0.8, -0.9, -0.9),
    new Vector3(-0.75, -0.35, -0.25),
  ]);
  const tube = new Mesh(new TubeGeometry(tubeCurve, 24, 0.055, 8, false), plastic);
  tube.name = "GEO_COOLING_TUBE";
  group.add(tube);

  return group;
};
