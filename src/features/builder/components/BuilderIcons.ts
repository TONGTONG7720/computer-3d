import {
  Box,
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  MemoryStick,
  RectangleHorizontal,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import type { HardwareCategory } from "../domain/hardware";

export type BuilderIcon = ComponentType<{
  readonly size?: number;
  readonly strokeWidth?: number;
}>;

export type CategoryDefinition = {
  readonly category: HardwareCategory;
  readonly label: string;
  readonly shortLabel: string;
  readonly icon: BuilderIcon;
};

export const categoryDefinitions: readonly CategoryDefinition[] = [
  { category: "cpu", label: "Processor", shortLabel: "CPU", icon: Cpu },
  { category: "gpu", label: "Graphics", shortLabel: "GPU", icon: RectangleHorizontal },
  { category: "motherboard", label: "Motherboard", shortLabel: "MB", icon: CircuitBoard },
  { category: "ram", label: "Memory", shortLabel: "RAM", icon: MemoryStick },
  { category: "storage", label: "Storage", shortLabel: "SSD", icon: HardDrive },
  { category: "cooling", label: "Cooling", shortLabel: "COOL", icon: Fan },
  { category: "power_supply", label: "Power", shortLabel: "PSU", icon: Zap },
  { category: "case", label: "Case", shortLabel: "CASE", icon: Box },
];

export const findCategoryDefinition = (category: HardwareCategory): CategoryDefinition =>
  categoryDefinitions.find((definition) => definition.category === category) ??
  categoryDefinitions[0] ?? {
    category: "cpu",
    label: "Processor",
    shortLabel: "CPU",
    icon: Cpu,
  };
