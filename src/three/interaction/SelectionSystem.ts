import type { Object3D } from "three";
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
