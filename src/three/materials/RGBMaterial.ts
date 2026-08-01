import { type ColorRepresentation, Mesh, MeshStandardMaterial, type Object3D } from "three";

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
