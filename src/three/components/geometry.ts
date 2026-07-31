import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  type Material,
  Mesh,
  TorusGeometry,
  type Vector3Tuple,
} from "three";

export const createBox = (
  name: string,
  size: Vector3Tuple,
  position: Vector3Tuple,
  material: Material,
): Mesh => {
  const mesh = new Mesh(new BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

export const createCylinder = (
  name: string,
  radius: number,
  depth: number,
  position: Vector3Tuple,
  material: Material,
): Mesh => {
  const mesh = new Mesh(new CylinderGeometry(radius, radius, depth, 32), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

export const createFanModule = (
  name: string,
  radius: number,
  position: Vector3Tuple,
  frameMaterial: Material,
  bladeMaterial: Material,
  rgbMaterial: Material,
): Group => {
  const fan = new Group();
  fan.name = name;
  fan.position.set(...position);

  const ring = new Mesh(new TorusGeometry(radius, 0.055, 10, 40), frameMaterial);
  ring.name = `${name}_RING`;
  ring.castShadow = true;
  fan.add(ring);

  const glow = new Mesh(new TorusGeometry(radius * 0.86, 0.025, 8, 40), rgbMaterial);
  glow.name = `RGB_${name}`;
  fan.add(glow);

  const hub = new Mesh(new CylinderGeometry(radius * 0.17, radius * 0.17, 0.12, 24), bladeMaterial);
  hub.rotation.x = Math.PI / 2;
  fan.add(hub);

  for (let index = 0; index < 7; index += 1) {
    const blade = new Mesh(new BoxGeometry(radius * 0.5, radius * 0.16, 0.035), bladeMaterial);
    blade.position.x = radius * 0.34;
    blade.rotation.z = (index / 7) * Math.PI * 2;
    blade.geometry.translate(radius * 0.12, 0, 0);
    fan.add(blade);
  }

  return fan;
};
