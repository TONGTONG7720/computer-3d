import type { CaseHardware, CoolingHardware, PsuHardware } from "../domain/hardware";
import { parseHardwareId } from "../domain/hardware";

export const towerAir: CoolingHardware = {
  id: parseHardwareId("cooling-tower-160"),
  name: "Core Tower 160",
  brand: "PC LAB",
  category: "cooling",
  price: 199,
  performance: 62,
  power: 5,
  modelUrl: "/models/cooling_tower_160.glb",
  modelVariant: "tower",
  maxTdp: 160,
  radiatorSize: 0,
  supportedSockets: ["LGA1700", "AM5"],
};

export const aio240: CoolingHardware = {
  id: parseHardwareId("cooling-aio-240"),
  name: "LAB AIO 240",
  brand: "PC LAB",
  category: "cooling",
  price: 399,
  performance: 76,
  power: 14,
  modelUrl: "/models/cooling_aio_240.glb",
  modelVariant: "aio-240",
  maxTdp: 220,
  radiatorSize: 240,
  supportedSockets: ["LGA1700", "AM5"],
};

export const aio360: CoolingHardware = {
  id: parseHardwareId("cooling-aio-360"),
  name: "LAB AIO 360",
  brand: "PC LAB",
  category: "cooling",
  price: 899,
  performance: 96,
  power: 22,
  modelUrl: "/models/cooling_aio_360.glb",
  modelVariant: "aio-360",
  maxTdp: 320,
  radiatorSize: 360,
  supportedSockets: ["LGA1700", "AM5"],
};

const createPsu = (
  id: string,
  name: string,
  price: number,
  wattage: number,
  certification: PsuHardware["certification"],
): PsuHardware => ({
  id: parseHardwareId(id),
  name,
  brand: "PC LAB",
  category: "power_supply",
  price,
  performance: Math.min(100, Math.round(wattage / 12)),
  power: 0,
  modelUrl: `/models/psu_${wattage}w.glb`,
  modelVariant: `${wattage}w`,
  wattage,
  certification,
});

export const psu850 = createPsu("psu-850w-gold", "850W Gold", 449, 850, "Gold");
export const psu1000 = createPsu("psu-1000w-platinum", "1000W Platinum", 699, 1000, "Platinum");
export const psu1200 = createPsu("psu-1200w-platinum", "1200W Platinum", 999, 1200, "Platinum");

export const futureGlassCase: CaseHardware = {
  id: parseHardwareId("case-future-glass"),
  name: "Future Glass Case",
  brand: "PC LAB",
  category: "case",
  price: 1299,
  performance: 94,
  power: 8,
  modelUrl: "/models/case_future_glass.glb",
  modelVariant: "future-glass",
  gpuMaxLength: 360,
  motherboardSize: ["ATX", "Micro-ATX"],
  radiatorMaxSize: 360,
};

export const compactCase: CaseHardware = {
  id: parseHardwareId("case-compact-lab"),
  name: "Compact LAB Case",
  brand: "PC LAB",
  category: "case",
  price: 399,
  performance: 66,
  power: 6,
  modelUrl: "/models/case_compact_lab.glb",
  modelVariant: "compact",
  gpuMaxLength: 300,
  motherboardSize: ["Micro-ATX"],
  radiatorMaxSize: 240,
};

export const mockCoolingHardware = [towerAir, aio240, aio360] as const;
export const mockPsuHardware = [psu850, psu1000, psu1200] as const;
export const mockCaseHardware = [futureGlassCase, compactCase] as const;
