import { z } from "zod";

export const hardwareCategories = [
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "storage",
  "cooling",
  "power_supply",
  "case",
] as const;

export const hardwareCategorySchema = z.enum(hardwareCategories);
export const hardwareIdSchema = z.string().min(1).brand<"HardwareId">();

export type HardwareCategory = z.infer<typeof hardwareCategorySchema>;
export type HardwareId = z.infer<typeof hardwareIdSchema>;
export type CpuSocket = "LGA1700" | "AM5";
export type RamGeneration = "DDR4" | "DDR5";
export type MotherboardFormFactor = "ATX" | "Micro-ATX";

export type HardwarePerformanceProfile = {
  readonly gaming: number;
  readonly creator: number;
  readonly ai: number;
  readonly source: string;
  readonly version: number;
};

export type HardwareModelDescriptor = {
  readonly id: number;
  readonly name: string;
  readonly glbUrl: string;
  readonly textureUrl: string;
  readonly previewUrl: string;
  readonly scale: Readonly<{ x: number; y: number; z: number }>;
  readonly position: Readonly<{ x: number; y: number; z: number }>;
  readonly rotation: Readonly<{ x: number; y: number; z: number }>;
  readonly animationConfig: Readonly<Record<string, unknown>>;
  readonly lodLevel: number;
  readonly fileSizeBytes: number;
  readonly checksumSha256: string;
  readonly primary: boolean;
  readonly status: "PROCESSING" | "READY" | "FAILED";
};

type HardwareBase<Category extends HardwareCategory> = {
  readonly databaseId?: number;
  readonly id: HardwareId;
  readonly name: string;
  readonly brand: string;
  readonly category: Category;
  readonly price: number;
  readonly performance: number;
  readonly power: number;
  readonly modelUrl: string;
  readonly modelVariant: string;
  readonly description?: string;
  readonly coverUrl?: string;
  readonly popularity?: number;
  readonly performanceProfile?: HardwarePerformanceProfile;
  readonly primaryModel?: HardwareModelDescriptor;
};

export type CpuHardware = HardwareBase<"cpu"> & {
  readonly socket: CpuSocket;
  readonly cores: number;
  readonly threads: number;
  readonly tdp: number;
  readonly generation?: string;
};

export type GpuHardware = HardwareBase<"gpu"> & {
  readonly vram: number;
  readonly length: number;
  readonly pcieInterface?: string;
  readonly resolutionSupport?: readonly string[];
};

export type MotherboardHardware = HardwareBase<"motherboard"> & {
  readonly socket: CpuSocket;
  readonly ramType: RamGeneration;
  readonly formFactor: MotherboardFormFactor;
  readonly chipset?: string;
};

export type RamHardware = HardwareBase<"ram"> & {
  readonly capacity: number;
  readonly generation: RamGeneration;
  readonly frequency: number;
};

export type StorageHardware = HardwareBase<"storage"> & {
  readonly capacity: number;
  readonly interface: "PCIe 4.0" | "PCIe 5.0";
  readonly readSpeed: number;
};

export type CoolingHardware = HardwareBase<"cooling"> & {
  readonly maxTdp: number;
  readonly radiatorSize: 0 | 240 | 360;
  readonly supportedSockets: readonly CpuSocket[];
};

export type PsuHardware = HardwareBase<"power_supply"> & {
  readonly wattage: number;
  readonly certification: "Gold" | "Platinum";
  readonly connectors?: readonly string[];
};

export type CaseHardware = HardwareBase<"case"> & {
  readonly gpuMaxLength: number;
  readonly motherboardSize: readonly MotherboardFormFactor[];
  readonly radiatorMaxSize: 240 | 360;
};

export type Hardware =
  | CpuHardware
  | GpuHardware
  | MotherboardHardware
  | RamHardware
  | StorageHardware
  | CoolingHardware
  | PsuHardware
  | CaseHardware;

export type SelectedComponents = {
  readonly cpu: CpuHardware | null;
  readonly gpu: GpuHardware | null;
  readonly motherboard: MotherboardHardware | null;
  readonly ram: RamHardware | null;
  readonly storage: StorageHardware | null;
  readonly cooling: CoolingHardware | null;
  readonly power_supply: PsuHardware | null;
  readonly case: CaseHardware | null;
};

export type SelectedComponentIds = {
  readonly cpu: HardwareId | null;
  readonly gpu: HardwareId | null;
  readonly motherboard: HardwareId | null;
  readonly ram: HardwareId | null;
  readonly storage: HardwareId | null;
  readonly cooling: HardwareId | null;
  readonly power_supply: HardwareId | null;
  readonly case: HardwareId | null;
};

export const parseHardwareId = (input: unknown): HardwareId => hardwareIdSchema.parse(input);

export const emptySelectedComponents = (): SelectedComponents => ({
  cpu: null,
  gpu: null,
  motherboard: null,
  ram: null,
  storage: null,
  cooling: null,
  power_supply: null,
  case: null,
});

export const replaceSelectedHardware = (
  selection: SelectedComponents,
  hardware: Hardware,
): SelectedComponents => {
  switch (hardware.category) {
    case "cpu":
      return { ...selection, cpu: hardware };
    case "gpu":
      return { ...selection, gpu: hardware };
    case "motherboard":
      return { ...selection, motherboard: hardware };
    case "ram":
      return { ...selection, ram: hardware };
    case "storage":
      return { ...selection, storage: hardware };
    case "cooling":
      return { ...selection, cooling: hardware };
    case "power_supply":
      return { ...selection, power_supply: hardware };
    case "case":
      return { ...selection, case: hardware };
  }
};

export const getSelectedHardware = (
  selection: SelectedComponents,
  category: HardwareCategory,
): Hardware | null => {
  switch (category) {
    case "cpu":
      return selection.cpu;
    case "gpu":
      return selection.gpu;
    case "motherboard":
      return selection.motherboard;
    case "ram":
      return selection.ram;
    case "storage":
      return selection.storage;
    case "cooling":
      return selection.cooling;
    case "power_supply":
      return selection.power_supply;
    case "case":
      return selection.case;
  }
};

export const toSelectedComponentIds = (selection: SelectedComponents): SelectedComponentIds => ({
  cpu: selection.cpu?.id ?? null,
  gpu: selection.gpu?.id ?? null,
  motherboard: selection.motherboard?.id ?? null,
  ram: selection.ram?.id ?? null,
  storage: selection.storage?.id ?? null,
  cooling: selection.cooling?.id ?? null,
  power_supply: selection.power_supply?.id ?? null,
  case: selection.case?.id ?? null,
});

export const formatHardwareSpec = (hardware: Hardware): string => {
  switch (hardware.category) {
    case "cpu":
      return `${hardware.cores}C / ${hardware.threads}T · ${hardware.socket}`;
    case "gpu":
      return `${hardware.vram}GB VRAM · ${hardware.length}mm`;
    case "motherboard":
      return `${hardware.socket} · ${hardware.ramType} · ${hardware.formFactor}`;
    case "ram":
      return `${hardware.capacity}GB · ${hardware.frequency}MHz`;
    case "storage":
      return `${hardware.capacity}TB · ${hardware.interface}`;
    case "cooling":
      return hardware.radiatorSize === 0
        ? `Air · ${hardware.maxTdp}W`
        : `${hardware.radiatorSize}mm · ${hardware.maxTdp}W`;
    case "power_supply":
      return `${hardware.wattage}W · ${hardware.certification}`;
    case "case":
      return `GPU ${hardware.gpuMaxLength}mm · ${hardware.motherboardSize.join("/")}`;
  }
};
