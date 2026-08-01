"use client";

import { CheckCircle2, PanelRight } from "lucide-react";
import { useBuilderWorkspaceStore } from "@/features/builder/store/BuilderStoreProvider";
import { ComponentSlotRail } from "@/features/hardware/ComponentSlotRail";
import styles from "./WorkspaceMobileControls.module.css";

type WorkspaceMobileControlsProps = {
  readonly onOpenComponents: () => void;
  readonly onOpenSummary: () => void;
};

const currencyFormatter = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 });
const formatCurrency = (value: number): string => currencyFormatter.format(value);

export function WorkspaceMobileControls({
  onOpenComponents,
  onOpenSummary,
}: WorkspaceMobileControlsProps) {
  const activeCategory = useBuilderWorkspaceStore((state) => state.activeCategory);
  const compatibility = useBuilderWorkspaceStore((state) => state.compatibilityStatus.status);
  const selectedComponents = useBuilderWorkspaceStore((state) => state.selectedComponents);
  const setActiveCategory = useBuilderWorkspaceStore((state) => state.setActiveCategory);
  const totalPrice = useBuilderWorkspaceStore((state) => state.totalPrice);

  return (
    <section aria-label="移动端配置控制" className={styles["dock"]}>
      <div className={styles["summary"]}>
        <span>
          <small>当前总价</small>
          <strong data-numeric="true">¥{formatCurrency(totalPrice)}</strong>
        </span>
        <span className={styles["compatibility"]} data-status={compatibility}>
          <CheckCircle2 aria-hidden="true" size={14} strokeWidth={1.7} />
          {compatibility === "success" ? "兼容" : compatibility === "warning" ? "需注意" : "有冲突"}
        </span>
        <button onClick={onOpenSummary} type="button">
          <PanelRight aria-hidden="true" size={17} strokeWidth={1.7} />
          分析
        </button>
      </div>
      <div className={styles["categories"]}>
        <ComponentSlotRail
          activeCategory={activeCategory}
          onSelectCategory={(category) => {
            setActiveCategory(category);
            onOpenComponents();
          }}
          selectedComponents={selectedComponents}
        />
      </div>
    </section>
  );
}
