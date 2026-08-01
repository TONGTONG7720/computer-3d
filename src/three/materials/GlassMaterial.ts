import { DoubleSide, MeshPhysicalMaterial } from "three";
import { materialTokens } from "./materialTokens";

export const createGlassMaterial = (): MeshPhysicalMaterial =>
  new MeshPhysicalMaterial({
    color: materialTokens.glassTint,
    metalness: 0.05,
    roughness: 0.08,
    transmission: 0.76,
    transparent: true,
    opacity: 0.22,
    thickness: 0.12,
    ior: 1.45,
    envMapIntensity: 1.25,
    depthWrite: false,
    side: DoubleSide,
  });
