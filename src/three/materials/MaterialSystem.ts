import {
  type ColorRepresentation,
  DoubleSide,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Object3D,
} from "three";

export const materialTokens = {
  graphiteMetal: 0x161d27,
  darkMetal: 0x080b10,
  brushedAluminum: 0xaeb8c5,
  plasticBlack: 0x11151c,
  auroraBody: 0x21152a,
  pcbGreen: 0x123f32,
  pcbBlack: 0x121922,
  copper: 0xc7793d,
  glassTint: 0x8fdcf2,
  cyan: 0x65e6ff,
  violet: 0x8c7bff,
  magenta: 0xff4fc6,
  warning: 0xffba5c,
  selected: 0xb7f3ff,
} as const;

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

export const createRgbMaterial = (color: ColorRepresentation): MeshStandardMaterial =>
  new MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.8,
    metalness: 0.15,
    roughness: 0.28,
    toneMapped: false,
  });

export const setRgbColor = (
  root: Object3D,
  color: ColorRepresentation,
  emissiveIntensity = 1.8,
): void => {
  root.traverse((object) => {
    if (!(object instanceof Mesh) || !object.name.startsWith("RGB_")) {
      return;
    }

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (material instanceof MeshStandardMaterial) {
        material.color.set(color);
        material.emissive.set(color);
        material.emissiveIntensity = emissiveIntensity;
      }
    }
  });
};
