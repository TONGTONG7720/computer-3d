import type { CompatibilityResult } from "@/features/builder/domain/CompatibilityEngine";
import type { Hardware, HardwareCategory } from "@/features/builder/domain/hardware";

export const hardwareCategoryLabels = {
  cpu: "处理器",
  gpu: "显卡",
  motherboard: "主板",
  ram: "内存",
  storage: "存储",
  cooling: "散热",
  power_supply: "电源",
  case: "机箱",
} as const satisfies Readonly<Record<HardwareCategory, string>>;

export const hardwareCategoryCodes = {
  cpu: "CPU",
  gpu: "GPU",
  motherboard: "MB",
  ram: "RAM",
  storage: "SSD",
  cooling: "COOL",
  power_supply: "PSU",
  case: "CASE",
} as const satisfies Readonly<Record<HardwareCategory, string>>;

export class UnsupportedHardwarePresentationError extends Error {
  constructor(hardware: never) {
    super(`Unsupported hardware: ${JSON.stringify(hardware)}`);
    this.name = "UnsupportedHardwarePresentationError";
  }
}

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 }).format(value);

export const formatHardwareSpec = (hardware: Hardware): string => {
  switch (hardware.category) {
    case "cpu":
      return `${hardware.cores} 核 · ${hardware.socket} · ${hardware.tdp}W TDP`;
    case "gpu":
      return `${hardware.vram}GB · ${hardware.length}mm · ${hardware.power}W`;
    case "motherboard":
      return `${hardware.socket} · ${hardware.ramType} · ${hardware.formFactor}`;
    case "ram":
      return `${hardware.capacity}GB · ${hardware.generation} · ${hardware.frequency}MT/s`;
    case "storage":
      return `${hardware.capacity}TB · ${hardware.interface} · ${hardware.readSpeed}MB/s`;
    case "cooling":
      return `${hardware.maxTdp}W TDP · ${hardware.radiatorSize === 0 ? "风冷" : `${hardware.radiatorSize}mm`}`;
    case "power_supply":
      return `${hardware.wattage}W · ${hardware.certification}`;
    case "case":
      return `GPU ${hardware.gpuMaxLength}mm · ${hardware.radiatorMaxSize}mm 冷排`;
    default:
      throw new UnsupportedHardwarePresentationError(hardware);
  }
};

export const getHardwareStateLabel = (
  installed: boolean,
  compatibility: CompatibilityResult | null,
): string => {
  if (compatibility?.status === "error") {
    return "存在冲突";
  }
  if (compatibility?.status === "warning") {
    return "需要注意";
  }
  return installed ? "已安装" : "可选择";
};
