import {
  Box,
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  type LucideIcon,
  MemoryStick,
  MonitorUp,
  PlugZap,
} from "lucide-react";
import type { HardwareCategory } from "@/features/builder/domain/hardware";

const categoryIcons = {
  cpu: Cpu,
  gpu: MonitorUp,
  motherboard: CircuitBoard,
  ram: MemoryStick,
  storage: HardDrive,
  cooling: Fan,
  power_supply: PlugZap,
  case: Box,
} as const satisfies Readonly<Record<HardwareCategory, LucideIcon>>;

type HardwareCategoryIconProps = {
  readonly category: HardwareCategory;
  readonly size?: number;
};

export function HardwareCategoryIcon({ category, size = 17 }: HardwareCategoryIconProps) {
  const Icon = categoryIcons[category];
  return <Icon aria-hidden="true" size={size} strokeWidth={1.55} />;
}
