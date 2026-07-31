import type { StoreApi } from "zustand";
import { type BuilderStore, builderStore } from "@/store/builderStore";
import { type EngineStore, engineStore } from "@/store/engineStore";
import {
  getSelectedHardware,
  type Hardware,
  hardwareCategories,
  type SelectedComponents,
} from "../domain/hardware";

export type BuilderEngineStores = {
  readonly builder: StoreApi<BuilderStore>;
  readonly engine: StoreApi<EngineStore>;
};

const defaultStores: BuilderEngineStores = {
  builder: builderStore,
  engine: engineStore,
};

const requestSceneReplacement = (hardware: Hardware, engine: StoreApi<EngineStore>): void => {
  engine.getState().requestReplacement({
    slot: hardware.category,
    assetId: hardware.id,
    modelUrl: hardware.modelUrl,
    variant: hardware.modelVariant,
  });
};

export const selectBuilderHardwareWithScene = (
  hardware: Hardware,
  stores: BuilderEngineStores = defaultStores,
): void => {
  stores.builder.getState().selectHardware(hardware);
  requestSceneReplacement(hardware, stores.engine);
};

export const applyBuilderSelectionWithScene = (
  selection: SelectedComponents,
  stores: BuilderEngineStores = defaultStores,
): void => {
  const previous = stores.builder.getState().selectedComponents;
  stores.builder.getState().applySelection(selection);

  for (const category of hardwareCategories) {
    const before = getSelectedHardware(previous, category);
    const after = getSelectedHardware(selection, category);
    if (after !== null && before?.id !== after.id) {
      requestSceneReplacement(after, stores.engine);
    }
  }
};
