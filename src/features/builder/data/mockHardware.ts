import type {
  Hardware,
  HardwareCategory,
  HardwareId,
  SelectedComponents,
} from "../domain/hardware";
import {
  aio360,
  futureGlassCase,
  mockCaseHardware,
  mockCoolingHardware,
  mockPsuHardware,
  psu1200,
} from "./mockChassisHardware";
import { intelI9, mockCpuHardware, mockGpuHardware, rtx5090 } from "./mockCoreHardware";
import {
  ddr5_64,
  mockMotherboardHardware,
  mockRamHardware,
  mockStorageHardware,
  nvme4Tb,
  z790Lab,
} from "./mockPlatformHardware";

export const hardwareByCategory = {
  cpu: mockCpuHardware,
  gpu: mockGpuHardware,
  motherboard: mockMotherboardHardware,
  ram: mockRamHardware,
  storage: mockStorageHardware,
  cooling: mockCoolingHardware,
  power_supply: mockPsuHardware,
  case: mockCaseHardware,
} as const satisfies Readonly<Record<HardwareCategory, readonly Hardware[]>>;

export const mockHardware: readonly Hardware[] = [
  ...hardwareByCategory.cpu,
  ...hardwareByCategory.gpu,
  ...hardwareByCategory.motherboard,
  ...hardwareByCategory.ram,
  ...hardwareByCategory.storage,
  ...hardwareByCategory.cooling,
  ...hardwareByCategory.power_supply,
  ...hardwareByCategory.case,
];

export const defaultSelectedComponents: SelectedComponents = {
  cpu: intelI9,
  gpu: rtx5090,
  motherboard: z790Lab,
  ram: ddr5_64,
  storage: nvme4Tb,
  cooling: aio360,
  power_supply: psu1200,
  case: futureGlassCase,
};

export const getHardwareById = (id: HardwareId | string): Hardware | undefined =>
  mockHardware.find((hardware) => hardware.id === id);

export const getHardwareByCategory = (category: HardwareCategory): readonly Hardware[] =>
  hardwareByCategory[category];
