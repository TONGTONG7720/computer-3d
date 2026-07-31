import { Group } from "three";
import {
  createGlassMaterial,
  createMetalMaterial,
  createRgbMaterial,
  materialTokens,
} from "../materials/MaterialSystem";
import { createBox } from "./geometry";

export const createPCCase = (): Group => {
  const group = new Group();
  group.name = "CMP_CASE";
  group.position.set(0, 2.45, 0);

  const metal = createMetalMaterial(materialTokens.graphiteMetal);
  const glass = createGlassMaterial();
  const rgb = createRgbMaterial(materialTokens.cyan);

  const verticals = [
    [-1.7, 0, -2],
    [1.7, 0, -2],
    [-1.7, 0, 2],
    [1.7, 0, 2],
  ] as const;
  for (const [x, y, z] of verticals) {
    group.add(createBox("GEO_CASE_FRAME_VERTICAL", [0.12, 4.9, 0.12], [x, y, z], metal));
  }

  const horizontals = [
    [0, -2.4, -2, 3.5, 0.12, 0.12],
    [0, 2.4, -2, 3.5, 0.12, 0.12],
    [0, -2.4, 2, 3.5, 0.12, 0.12],
    [0, 2.4, 2, 3.5, 0.12, 0.12],
    [-1.7, -2.4, 0, 0.12, 0.12, 4],
    [1.7, -2.4, 0, 0.12, 0.12, 4],
    [-1.7, 2.4, 0, 0.12, 0.12, 4],
    [1.7, 2.4, 0, 0.12, 0.12, 4],
  ] as const;
  for (const [x, y, z, width, height, depth] of horizontals) {
    group.add(createBox("GEO_CASE_FRAME_HORIZONTAL", [width, height, depth], [x, y, z], metal));
  }

  group.add(createBox("GEO_CASE_GLASS_SIDE", [0.035, 4.55, 3.72], [1.68, 0, 0], glass));
  group.add(createBox("GEO_CASE_GLASS_FRONT", [3.25, 4.55, 0.035], [0, 0, 1.98], glass));
  group.add(createBox("GEO_CASE_FLOOR", [3.3, 0.08, 3.85], [0, -2.32, 0], metal));
  group.add(createBox("RGB_CASE_BASE", [3.08, 0.035, 0.06], [0, -2.24, 1.88], rgb));

  return group;
};
