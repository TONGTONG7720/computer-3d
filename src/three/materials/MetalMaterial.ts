import { type ColorRepresentation, MeshStandardMaterial } from "three";
import { materialTokens } from "./materialTokens";

export const createMetalMaterial = (
  color: ColorRepresentation = materialTokens.graphiteMetal,
): MeshStandardMaterial =>
  new MeshStandardMaterial({
    color,
    metalness: 0.88,
    roughness: 0.28,
    envMapIntensity: 1.15,
  });

export const createPlasticMaterial = (
  color: ColorRepresentation = materialTokens.plasticBlack,
): MeshStandardMaterial =>
  new MeshStandardMaterial({
    color,
    metalness: 0.08,
    roughness: 0.58,
    envMapIntensity: 0.55,
  });

export const createPcbMaterial = (): MeshStandardMaterial =>
  new MeshStandardMaterial({
    color: materialTokens.pcbGreen,
    metalness: 0.12,
    roughness: 0.68,
  });
