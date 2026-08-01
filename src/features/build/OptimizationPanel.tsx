"use client";

import { AlertTriangle, ArrowRight, Check, LoaderCircle, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { OptimizationGoal } from "@/features/builder/domain/intelligence";
import { useBuilderWorkspaceStore } from "@/features/builder/store/BuilderStoreProvider";
import { formatCurrency } from "@/features/hardware/hardwarePresentation";
import styles from "./OptimizationPanel.module.css";

const goalLabels = {
  balanced: "均衡配置",
  gaming: "游戏优先",
  creator: "内容创作",
  ai: "AI 工作站",
} as const satisfies Readonly<Record<OptimizationGoal, string>>;

const signedCurrency = (value: number): string =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}¥${formatCurrency(Math.abs(value))}`;

export function OptimizationPanel() {
  const [goal, setGoal] = useState<OptimizationGoal>("gaming");
  const catalogueStatus = useBuilderWorkspaceStore((state) => state.catalogueStatus);
  const status = useBuilderWorkspaceStore((state) => state.optimizationStatus);
  const optimization = useBuilderWorkspaceStore((state) => state.optimization);
  const error = useBuilderWorkspaceStore((state) => state.optimizationError);
  const requestOptimization = useBuilderWorkspaceStore((state) => state.requestOptimization);
  const applyOptimization = useBuilderWorkspaceStore((state) => state.applyOptimization);
  const clearOptimization = useBuilderWorkspaceStore((state) => state.clearOptimization);

  return (
    <section aria-labelledby="build-optimizer-title" className={styles["panel"]}>
      <div className={styles["header"]}>
        <span>
          <SlidersHorizontal aria-hidden="true" size={15} strokeWidth={1.7} />
          <strong id="build-optimizer-title">BUILD OPTIMIZER</strong>
        </span>
        <small>规则引擎</small>
      </div>

      <div className={styles["controls"]}>
        <label>
          <span>优化目标</span>
          <select
            aria-label="优化目标"
            onChange={(event) => {
              setGoal(event.target.value as OptimizationGoal);
              clearOptimization();
            }}
            value={goal}
          >
            {Object.entries(goalLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={catalogueStatus !== "ready" || status === "loading"}
          onClick={() => void requestOptimization(goal)}
          type="button"
        >
          {status === "loading" ? (
            <LoaderCircle aria-hidden="true" className={styles["spinner"]} size={14} />
          ) : (
            <ArrowRight aria-hidden="true" size={14} />
          )}
          {status === "loading" ? "正在分析" : "生成优化方案"}
        </button>
      </div>

      {status === "idle" ? (
        <p className={styles["hint"]}>按预算、兼容与性能数据生成可审阅方案，不会自动修改配置。</p>
      ) : null}

      {status === "error" ? (
        <div className={styles["error"]} role="alert">
          <AlertTriangle aria-hidden="true" size={14} />
          <span>{error}</span>
          <button onClick={() => void requestOptimization(goal)} type="button">
            重试
          </button>
        </div>
      ) : null}

      {status === "ready" && optimization !== null ? (
        <div className={styles["proposal"]}>
          <div className={styles["proposalSummary"]}>
            <span data-direction={optimization.priceDelta > 0 ? "up" : "down"}>
              价格 {signedCurrency(optimization.priceDelta)}
            </span>
            <span data-direction={optimization.profileDelta >= 0 ? "up" : "down"}>
              {goalLabels[optimization.goal]} {optimization.profileDelta > 0 ? "+" : ""}
              {optimization.profileDelta}
            </span>
          </div>

          {optimization.suggestions.length > 0 ? (
            <ul className={styles["suggestions"]}>
              {optimization.suggestions.map((suggestion) => (
                <li key={suggestion.code}>
                  <Check aria-hidden="true" size={13} />
                  <span>
                    <strong>{suggestion.title}</strong>
                    <small>{suggestion.reason}</small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles["hint"]}>{optimization.reason}</p>
          )}

          {optimization.unresolvedBudget > 0 ? (
            <p className={styles["shortfall"]}>
              仍超出预算 ¥{formatCurrency(optimization.unresolvedBudget)}
              ，建议调整预算或核心性能目标。
            </p>
          ) : null}

          <button
            className={styles["applyButton"]}
            disabled={!optimization.changed}
            onClick={applyOptimization}
            type="button"
          >
            {optimization.changed ? "应用优化" : "当前配置已是最优"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
