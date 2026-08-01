import type { PerspectiveCamera } from "three";

export const applyPerspectiveFov = (camera: PerspectiveCamera, fov: number): void => {
  camera.fov = fov;
  camera.updateProjectionMatrix();
};
