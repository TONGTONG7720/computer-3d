import { categoryDefinitions } from "@/features/builder/components/BuilderIcons";
import {
  getSelectedHardware,
  type HardwareCategory,
  type SelectedComponents,
} from "@/features/builder/domain/hardware";
import styles from "./PriceHardwareTabs.module.css";

type PriceHardwareTabsProps = {
  readonly activeCategory: HardwareCategory;
  readonly onChange: (category: HardwareCategory) => void;
  readonly selectedComponents: SelectedComponents;
};

export function PriceHardwareTabs({
  activeCategory,
  onChange,
  selectedComponents,
}: PriceHardwareTabsProps) {
  return (
    <nav aria-label="比价硬件" className={styles["hardwareTabs"]}>
      {categoryDefinitions.map((definition) => {
        const hardware = getSelectedHardware(selectedComponents, definition.category);
        const label = `${definition.shortLabel} · ${hardware?.name ?? "未选择"}`;
        return (
          <button
            aria-label={label}
            aria-pressed={activeCategory === definition.category}
            disabled={hardware === null}
            key={definition.category}
            onClick={() => onChange(definition.category)}
            title={label}
            type="button"
          >
            <definition.icon size={14} strokeWidth={1.5} />
            <span>{definition.shortLabel}</span>
            <small>{hardware?.name ?? "未选择"}</small>
          </button>
        );
      })}
    </nav>
  );
}
