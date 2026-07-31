import type { MotherboardHardware, RamHardware, StorageHardware } from "../domain/hardware";
import { parseHardwareId } from "../domain/hardware";

export const z790Lab: MotherboardHardware = {
  id: parseHardwareId("motherboard-z790-lab"),
  name: "Z790 LAB",
  brand: "PC LAB",
  category: "motherboard",
  price: 2399,
  performance: 96,
  power: 65,
  modelUrl: "/models/motherboard_z790_lab.glb",
  modelVariant: "z790",
  socket: "LGA1700",
  ramType: "DDR5",
  formFactor: "ATX",
};

export const b650Lab: MotherboardHardware = {
  id: parseHardwareId("motherboard-b650-lab"),
  name: "B650M LAB",
  brand: "PC LAB",
  category: "motherboard",
  price: 699,
  performance: 72,
  power: 45,
  modelUrl: "/models/motherboard_b650m_lab.glb",
  modelVariant: "b650",
  socket: "AM5",
  ramType: "DDR5",
  formFactor: "Micro-ATX",
};

export const b760D4Lab: MotherboardHardware = {
  id: parseHardwareId("motherboard-b760-d4-lab"),
  name: "B760M D4 LAB",
  brand: "PC LAB",
  category: "motherboard",
  price: 799,
  performance: 68,
  power: 45,
  modelUrl: "/models/motherboard_b760_d4_lab.glb",
  modelVariant: "b760-d4",
  socket: "LGA1700",
  ramType: "DDR4",
  formFactor: "Micro-ATX",
};

export const ddr5_64: RamHardware = {
  id: parseHardwareId("ram-ddr5-64gb"),
  name: "Spectral DDR5 64GB",
  brand: "PC LAB",
  category: "ram",
  price: 1199,
  performance: 94,
  power: 18,
  modelUrl: "/models/ram_ddr5_64gb.glb",
  modelVariant: "ddr5-64",
  capacity: 64,
  generation: "DDR5",
  frequency: 6800,
};

export const ddr5_32: RamHardware = {
  id: parseHardwareId("ram-ddr5-32gb"),
  name: "Spectral DDR5 32GB",
  brand: "PC LAB",
  category: "ram",
  price: 399,
  performance: 74,
  power: 10,
  modelUrl: "/models/ram_ddr5_32gb.glb",
  modelVariant: "ddr5-32",
  capacity: 32,
  generation: "DDR5",
  frequency: 6000,
};

export const ddr4_32: RamHardware = {
  id: parseHardwareId("ram-ddr4-32gb"),
  name: "Core DDR4 32GB",
  brand: "PC LAB",
  category: "ram",
  price: 299,
  performance: 56,
  power: 9,
  modelUrl: "/models/ram_ddr4_32gb.glb",
  modelVariant: "ddr4-32",
  capacity: 32,
  generation: "DDR4",
  frequency: 3600,
};

export const nvme4Tb: StorageHardware = {
  id: parseHardwareId("storage-nvme-4tb"),
  name: "Nebula NVMe 4TB",
  brand: "PC LAB",
  category: "storage",
  price: 1599,
  performance: 92,
  power: 10,
  modelUrl: "/models/storage_nvme_4tb.glb",
  modelVariant: "nvme-4tb",
  capacity: 4,
  interface: "PCIe 5.0",
  readSpeed: 12000,
};

export const nvme1Tb: StorageHardware = {
  id: parseHardwareId("storage-nvme-1tb"),
  name: "Pulse NVMe 1TB",
  brand: "PC LAB",
  category: "storage",
  price: 299,
  performance: 68,
  power: 7,
  modelUrl: "/models/storage_nvme_1tb.glb",
  modelVariant: "nvme-1tb",
  capacity: 1,
  interface: "PCIe 4.0",
  readSpeed: 7000,
};

export const mockMotherboardHardware = [z790Lab, b650Lab, b760D4Lab] as const;
export const mockRamHardware = [ddr5_64, ddr5_32, ddr4_32] as const;
export const mockStorageHardware = [nvme4Tb, nvme1Tb] as const;
