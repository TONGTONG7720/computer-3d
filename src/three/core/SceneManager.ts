import { Group, type Scene } from "three";
import type { ComponentType } from "../models/modelManifest";

export type SceneComponent = {
  readonly slot: ComponentType;
  readonly assetId: string;
  readonly object: Group;
};

export class SceneSlotOccupiedError extends Error {
  readonly slot: ComponentType;

  constructor(slot: ComponentType) {
    super(`Scene slot "${slot}" is already occupied.`);
    this.name = "SceneSlotOccupiedError";
    this.slot = slot;
  }
}

export class SceneManager {
  readonly root = new Group();
  private readonly components = new Map<ComponentType, SceneComponent>();

  constructor() {
    this.root.name = "GRP_PC_ROOT";
  }

  mount(scene: Scene): void {
    if (this.root.parent !== null) {
      this.root.removeFromParent();
    }
    scene.add(this.root);
  }

  register(component: SceneComponent): void {
    if (this.components.has(component.slot)) {
      throw new SceneSlotOccupiedError(component.slot);
    }

    component.object.name = `CMP_${component.slot.toUpperCase()}`;
    this.components.set(component.slot, component);
    this.root.add(component.object);
  }

  get(slot: ComponentType): SceneComponent | undefined {
    return this.components.get(slot);
  }

  replace(component: SceneComponent): SceneComponent | undefined {
    const previous = this.components.get(component.slot);
    previous?.object.removeFromParent();

    component.object.name = `CMP_${component.slot.toUpperCase()}`;
    this.components.set(component.slot, component);
    this.root.add(component.object);
    return previous;
  }

  remove(slot: ComponentType): SceneComponent | undefined {
    const component = this.components.get(slot);
    if (component === undefined) {
      return undefined;
    }

    component.object.removeFromParent();
    this.components.delete(slot);
    return component;
  }

  list(): readonly SceneComponent[] {
    return [...this.components.values()];
  }

  clear(): readonly SceneComponent[] {
    const removed = this.list();
    for (const component of removed) {
      component.object.removeFromParent();
    }
    this.components.clear();
    return removed;
  }
}
