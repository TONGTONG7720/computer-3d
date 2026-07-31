"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useBuilderStore } from "@/store/builderStore";
import {
  type RecommendationUseCase,
  recommendationUseCases,
  recommendBuild,
} from "../domain/RecommendationEngine";
import { applyBuilderSelectionWithScene } from "../sync/BuilderEngineSync";
import styles from "./BuilderDialogs.module.css";

type RecommendationDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
};

const useCaseLabels: Readonly<Record<RecommendationUseCase, string>> = {
  gaming: "Gaming",
  productivity: "Creator",
  ai: "AI",
};

export function RecommendationDialog({ open, onClose }: RecommendationDialogProps) {
  const [budget, setBudget] = useState(8000);
  const [useCase, setUseCase] = useState<RecommendationUseCase>("gaming");
  const catalogue = useBuilderStore((state) => state.catalogue);
  const recommendation = useMemo(
    () => (catalogue.length > 0 ? recommendBuild({ budget, useCase }, catalogue) : null),
    [budget, catalogue, useCase],
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className={styles["backdrop"]}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.section
            aria-labelledby="recommendation-title"
            aria-modal="true"
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={styles["dialog"]}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <header className={styles["header"]}>
              <div>
                <p>SMART PRESET</p>
                <h2 id="recommendation-title">Build for your mission</h2>
                <span>内部规则引擎会在预算内寻找兼容且性能最高的组合。</span>
              </div>
              <button
                aria-label="关闭智能配置"
                className={styles["closeButton"]}
                onClick={onClose}
                type="button"
              >
                <X size={17} />
              </button>
            </header>

            <label className={styles["field"]}>
              <span className={styles["fieldLabel"]}>BUDGET / CNY</span>
              <input
                className={styles["input"]}
                max={50000}
                min={5000}
                onChange={(event) => {
                  const nextBudget = event.currentTarget.valueAsNumber;
                  if (Number.isFinite(nextBudget)) {
                    setBudget(Math.min(50000, Math.max(5000, nextBudget)));
                  }
                }}
                step={500}
                type="number"
                value={budget}
              />
            </label>

            <fieldset className={styles["useCases"]}>
              <legend className={styles["visuallyHidden"]}>配置用途</legend>
              {recommendationUseCases.map((option) => (
                <button
                  className={styles["useCase"]}
                  data-active={useCase === option}
                  key={option}
                  onClick={() => setUseCase(option)}
                  type="button"
                >
                  {useCaseLabels[option]}
                </button>
              ))}
            </fieldset>

            <div className={styles["preview"]}>
              <p className={styles["previewLabel"]}>RECOMMENDED MACHINE</p>
              {recommendation === null ? (
                <p className={styles["savedMessage"]}>硬件数据正在同步，请稍后重试。</p>
              ) : (
                <>
                  <div className={styles["previewMachine"]}>
                    <div>
                      <span>CPU</span>
                      <strong>{recommendation.components.cpu?.name}</strong>
                    </div>
                    <div>
                      <span>GPU</span>
                      <strong>{recommendation.components.gpu?.name}</strong>
                    </div>
                    <div>
                      <span>PERFORMANCE</span>
                      <strong>
                        {useCase === "productivity"
                          ? recommendation.performance.production
                          : recommendation.performance[useCase]}
                        /100
                      </strong>
                    </div>
                  </div>
                  <div className={styles["previewPrice"]}>
                    <span>TOTAL CONFIGURATION</span>
                    <strong>¥{recommendation.totalPrice.toLocaleString("zh-CN")}</strong>
                  </div>
                  {recommendation.overBudget ? (
                    <p className={styles["overBudget"]}>当前预算低于最小完整兼容方案。</p>
                  ) : null}
                  <ul className={styles["reasons"]}>
                    {recommendation.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <footer className={styles["actions"]}>
              <button className={styles["secondaryButton"]} onClick={onClose} type="button">
                CANCEL
              </button>
              <motion.button
                className={styles["primaryButton"]}
                disabled={recommendation === null}
                onClick={() => {
                  if (recommendation === null) {
                    return;
                  }
                  applyBuilderSelectionWithScene(recommendation.components);
                  onClose();
                }}
                type="button"
                whileTap={{ scale: 0.97 }}
              >
                <Sparkles size={15} />
                APPLY BUILD
              </motion.button>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
