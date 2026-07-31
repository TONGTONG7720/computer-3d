import { type Color, Mesh, MeshStandardMaterial, type Object3D } from "three";
import { materialTokens } from "../materials/MaterialSystem";
import type { ComponentType } from "../models/modelManifest";

const componentNames = {
  CMP_CASE: "case",
  CMP_MOTHERBOARD: "motherboard",
  CMP_CPU: "cpu",
  CMP_GPU: "gpu",
  CMP_RAM: "ram",
  CMP_STORAGE: "storage",
  CMP_COOLING: "cooling",
  CMP_FAN: "fan",
  CMP_POWER_SUPPLY: "power_supply",
} as const satisfies Record<string, ComponentType>;

type ComponentName = keyof typeof componentNames;

export type SelectionResult = {
  readonly componentType: ComponentType;
  readonly root: Object3D;
};

const isComponentName = (name: string): name is ComponentName =>
  Object.hasOwn(componentNames, name);

export const resolveSelection = (object: Object3D): SelectionResult | undefined => {
  let current: Object3D | null = object;
  while (current !== null) {
    if (isComponentName(current.name)) {
      return {
        componentType: componentNames[current.name],
        root: current,
      };
    }
    current = current.parent;
  }
  return undefined;
};

type MaterialSnapshot = {
  readonly material: MeshStandardMaterial;
  readonly emissive: Color;
  readonly emissiveIntensity: number;
};

export class SelectionSystem {
  private snapshots: readonly MaterialSnapshot[] = [];

  select(root: Object3D): void {
    this.clear();
    const nextSnapshots: MaterialSnapshot[] = [];

    root.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!(material instanceof MeshStandardMaterial)) {
          continue;
        }

        nextSnapshots.push({
          material,
          emissive: material.emissive.clone(),
          emissiveIntensity: material.emissiveIntensity,
        });
        material.emissive.set(materialTokens.selected);
        material.emissiveIntensity = Math.max(material.emissiveIntensity, 0.72);
      }
    });

    this.snapshots = nextSnapshots;
  }

  clear(): void {
    for (const snapshot of this.snapshots) {
      snapshot.material.emissive.copy(snapshot.emissive);
      snapshot.material.emissiveIntensity = snapshot.emissiveIntensity;
    }
    this.snapshots = [];
  }
}
