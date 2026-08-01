"use client";

import { AlertTriangle, Check } from "lucide-react";
import { hardwareCategories } from "@/features/builder/domain/hardware";
import { useBuilderWorkspaceStore } from "@/features/builder/store/BuilderStoreProvider";
import { HardwareCategoryIcon } from "@/features/hardware/HardwareCategoryIcon";
import { hardwareCategoryLabels } from "@/features/hardware/hardwarePresentation";
import styles from "./BuildPanel.module.css";
import { CompatibilityCard } from "./CompatibilityCard";
import { PerformanceCard } from "./PerformanceCard";
import { PriceCard } from "./PriceCard";

export function BuildPanel() {
  const selectedComponents = useBuilderWorkspaceStore((state) => state.selectedComponents);
  const performance = useBuilderWorkspaceStore((state) => state.performanceScore);
  const compatibility = useBuilderWorkspaceStore((state) => state.compatibilityStatus);
  const totalPrice = useBuilderWorkspaceStore((state) => state.totalPrice);
  const powerUsage = useBuilderWorkspaceStore((state) => state.powerUsage);
  const feedback = useBuilderWorkspaceStore((state) => state.feedback);
  const installedCount = hardwareCategories.filter(
    (category) => selectedComponents[category] !== null,
  ).length;

  return (
    <div className={styles["panel"]}>
      <div className={styles["panelHeader"]}>
        <span>
          <small>MY BUILD</small>
          <strong>配置分析</strong>
        </span>
        <span data-status={compatibility.status}>
          {compatibility.status === "error" ? (
            <AlertTriangle aria-hidden="true" size={13} />
          ) : (
            <Check aria-hidden="true" size={13} />
          )}
          {installedCount} / 8
        </span>
      </div>

      <ul aria-label="当前配置" className={styles["configuration"]}>
        {hardwareCategories.map((category) => {
          const hardware = selectedComponents[category];
          const issue =
            hardware === null
              ? undefined
              : compatibility.results.find(
                  (result) =>
                    result.status !== "success" && result.components.includes(hardware.id),
                );
          return (
            <li data-issue={issue?.status} key={category} title={issue?.message}>
              <HardwareCategoryIcon category={category} size={15} />
              <span>{hardwareCategoryLabels[category]}</span>
              <strong>{hardware?.name ?? "未选择"}</strong>
              {issue === undefined ? (
                <Check aria-hidden="true" size={13} />
              ) : (
                <AlertTriangle aria-hidden="true" size={13} />
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles["analysis"]}>
        <PerformanceCard scores={performance} />
        <CompatibilityCard summary={compatibility} />
      </div>
      <PriceCard powerUsage={powerUsage} priceDelta={feedback.priceDelta} totalPrice={totalPrice} />
    </div>
  );
}
