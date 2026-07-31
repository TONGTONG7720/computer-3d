import { Group, LOD } from "three";
import {
  createMetalMaterial,
  createPlasticMaterial,
  createRgbMaterial,
  materialTokens,
} from "../materials/MaterialSystem";
import { createBox, createFanModule } from "./geometry";

type GpuAppearance = {
  readonly accent?: number;
  readonly body?: number;
};

export const createGPU = (appearance: GpuAppearance = {}): Group => {
  const group = new Group();
  group.name = "CMP_GPU";
  group.position.set(0.1, 2.2, -0.48);

  const body = createPlasticMaterial(appearance.body ?? materialTokens.plasticBlack);
  const metal = createMetalMaterial(materialTokens.darkMetal);
  const rgb = createRgbMaterial(appearance.accent ?? materialTokens.cyan);
  const detail = new Group();
  detail.name = "LOD_GPU_DETAIL";
  detail.userData["lodDistance"] = 0;

  detail.add(createBox("GEO_GPU_SHROUD", [2.85, 0.78, 0.52], [0, 0, 0], body));
  detail.add(createBox("GEO_GPU_BACKPLATE", [2.9, 0.72, 0.07], [0, 0, -0.29], metal));
  detail.add(createBox("GEO_GPU_PCIE", [1.6, 0.06, 0.1], [-0.3, -0.43, -0.08], metal));
  detail.add(createBox("RGB_GPU_EDGE", [2.4, 0.035, 0.04], [0, 0.39, 0.26], rgb));

  const fanPositions = [-0.92, 0, 0.92] as const;
  fanPositions.forEach((x, index) => {
    detail.add(createFanModule(`GEO_GPU_FAN_0${index + 1}`, 0.31, [x, 0, 0.28], metal, body, rgb));
  });

  const lowDetail = createBox("LOD_GPU_PROXY", [2.85, 0.78, 0.52], [0, 0, 0], body);
  lowDetail.userData["lodDistance"] = 14.5;

  const lod = new LOD();
  lod.name = "LOD_GPU";
  lod.addLevel(detail, 0);
  lod.addLevel(lowDetail, 14.5);
  group.add(lod);

  return group;
};
