import type {
  CaseHardware,
  CoolingHardware,
  CpuHardware,
  GpuHardware,
  Hardware,
  MotherboardHardware,
  PsuHardware,
  RamHardware,
  SelectedComponents,
  StorageHardware,
} from "@/features/builder/domain/hardware";
import { type ModelDescriptor, ModelRegistry } from "../models/ModelRegistry";

export type ScenePart<Part extends Hardware> = {
  readonly hardware: Part;
  readonly descriptor: ModelDescriptor;
};

export type BuilderSceneSelection = {
  readonly pc_case: ScenePart<CaseHardware> | null;
  readonly motherboard: ScenePart<MotherboardHardware> | null;
  readonly cpu_socket: ScenePart<CpuHardware> | null;
  readonly gpu_slot: ScenePart<GpuHardware> | null;
  readonly ram_slots: ScenePart<RamHardware> | null;
  readonly storage_slots: ScenePart<StorageHardware> | null;
  readonly cooling_mount: ScenePart<CoolingHardware> | null;
  readonly psu_area: ScenePart<PsuHardware> | null;
};

const resolvePart = <Part extends Hardware>(
  hardware: Part | null,
  registry: ModelRegistry,
): ScenePart<Part> | null =>
  hardware === null
    ? null
    : {
        hardware,
        descriptor: registry.resolve(hardware),
      };

export const createBuilderSceneSelection = (
  selection: SelectedComponents,
  registry = new ModelRegistry(),
): BuilderSceneSelection => ({
  pc_case: resolvePart(selection.case, registry),
  motherboard: resolvePart(selection.motherboard, registry),
  cpu_socket: resolvePart(selection.cpu, registry),
  gpu_slot: resolvePart(selection.gpu, registry),
  ram_slots: resolvePart(selection.ram, registry),
  storage_slots: resolvePart(selection.storage, registry),
  cooling_mount: resolvePart(selection.cooling, registry),
  psu_area: resolvePart(selection.power_supply, registry),
});
