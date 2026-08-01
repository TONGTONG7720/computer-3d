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
import { hardwareCategories, type SelectedComponents } from "@/features/builder/domain/hardware";
import styles from "./ComponentSlotRail.module.css";
import { hardwareCategoryLabels } from "./hardwarePresentation";

const categoryIcons = {
  cpu: Cpu,
  gpu: MonitorUp,
  motherboard: CircuitBoard,
  ram: MemoryStick,
  storage: HardDrive,
  cooling: Fan,
  power_supply: PlugZap,
  case: Box,
} as const satisfies Readonly<Record<(typeof hardwareCategories)[number], LucideIcon>>;

type ComponentSlotRailProps = {
  readonly activeCategory: (typeof hardwareCategories)[number];
  readonly selectedComponents: SelectedComponents;
  readonly onSelectCategory: (category: (typeof hardwareCategories)[number]) => void;
};

export function ComponentSlotRail({
  activeCategory,
  onSelectCategory,
  selectedComponents,
}: ComponentSlotRailProps) {
  return (
    <nav aria-label="组件分类" className={styles["rail"]}>
      {hardwareCategories.map((category) => {
        const Icon = categoryIcons[category];
        const selected = selectedComponents[category];
        const installed = selected !== null;
        return (
          <button
            aria-current={activeCategory === category ? "true" : undefined}
            aria-label={`${hardwareCategoryLabels[category]}，${installed ? `已安装 ${selected.name}` : "未选择"}`}
            className={styles["slot"]}
            data-active={activeCategory === category}
            key={category}
            onClick={() => onSelectCategory(category)}
            type="button"
          >
            <Icon aria-hidden="true" size={17} strokeWidth={1.55} />
            <span className={styles["slotCopy"]}>
              <strong>{hardwareCategoryLabels[category]}</strong>
              <small>{selected?.name ?? "选择组件"}</small>
            </span>
            <span aria-hidden="true" className={styles["slotState"]} data-installed={installed} />
          </button>
        );
      })}
    </nav>
  );
}
