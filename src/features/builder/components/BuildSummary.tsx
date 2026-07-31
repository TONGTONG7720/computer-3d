"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Cpu,
  MemoryStick,
  RectangleHorizontal,
  Save,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useBuilderStore } from "@/store/builderStore";
import { AnimatedNumber } from "./AnimatedNumber";
import styles from "./BuildSummary.module.css";
import { SaveBuildDialog } from "./SaveBuildDialog";

const scoreRows = [
  { key: "gaming", label: "GAMING" },
  { key: "production", label: "PRODUCTION" },
  { key: "ai", label: "AI COMPUTE" },
] as const;

export function BuildSummary() {
  const [saveOpen, setSaveOpen] = useState(false);
  const selected = useBuilderStore((state) => state.selectedComponents);
  const totalPrice = useBuilderStore((state) => state.totalPrice);
  const powerUsage = useBuilderStore((state) => state.powerUsage);
  const performance = useBuilderStore((state) => state.performanceScore);
  const compatibility = useBuilderStore((state) => state.compatibilityStatus);
  const catalogueStatus = useBuilderStore((state) => state.catalogueStatus);
  const visibleRules = compatibility.results.filter((rule) => rule.status !== "success");
  const rules =
    visibleRules.length > 0 ? visibleRules.slice(0, 3) : compatibility.results.slice(0, 2);
  const statusLabel =
    compatibility.status === "success"
      ? "READY"
      : compatibility.status === "warning"
        ? "CHECK"
        : "BLOCKED";

  const componentRows = [
    { label: "CPU", name: selected.cpu?.name ?? "Not selected", icon: Cpu },
    { label: "GPU", name: selected.gpu?.name ?? "Not selected", icon: RectangleHorizontal },
    { label: "RAM", name: selected.ram?.name ?? "Not selected", icon: MemoryStick },
    { label: "PSU", name: selected.power_supply?.name ?? "Not selected", icon: Zap },
  ] as const;

  return (
    <div className={styles["root"]}>
      <p className={styles["eyebrow"]}>YOUR MACHINE</p>
      <div className={styles["title"]}>
        <h2>Future System 01</h2>
        <span>{statusLabel}</span>
      </div>

      <div className={styles["components"]}>
        {componentRows.map((row) => {
          const Icon = row.icon;
          return (
            <div className={styles["componentRow"]} key={row.label}>
              <span>
                <Icon size={14} strokeWidth={1.6} />
              </span>
              <span>{row.label}</span>
              <strong title={row.name}>{row.name}</strong>
            </div>
          );
        })}
      </div>

      <section className={styles["priceBlock"]}>
        <div className={styles["priceLabel"]}>
          <span>TOTAL CONFIGURATION</span>
          <span>LIVE</span>
        </div>
        <div className={styles["price"]}>
          <small>¥</small>
          <AnimatedNumber value={totalPrice} />
        </div>
      </section>

      <div className={styles["metricGrid"]}>
        <div className={styles["metric"]}>
          <span>PERFORMANCE</span>
          <strong>
            <AnimatedNumber value={performance.overall} /> / 100
          </strong>
        </div>
        <div className={styles["metric"]}>
          <span>PEAK POWER</span>
          <strong>
            <AnimatedNumber value={powerUsage} /> W
          </strong>
        </div>
      </div>

      <section className={styles["scoreSection"]}>
        <div className={styles["sectionTitle"]}>
          <span>PERFORMANCE MATRIX</span>
          <strong>P{performance.overall}</strong>
        </div>
        <div className={styles["scoreList"]}>
          {scoreRows.map((row) => (
            <div className={styles["scoreRow"]} key={row.key}>
              <span>{row.label}</span>
              <span className={styles["scoreTrack"]}>
                <motion.span
                  animate={{ scaleX: performance[row.key] / 100 }}
                  initial={false}
                  transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
                />
              </span>
              <strong>{performance[row.key]}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className={styles["compatibility"]}>
        <div className={styles["sectionTitle"]}>
          <span>COMPATIBILITY</span>
          <strong>{statusLabel}</strong>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={styles["compatibilityCard"]}
            data-status={compatibility.status}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0, y: 5 }}
            key={`${compatibility.status}-${rules.map((rule) => rule.rule).join("-")}`}
          >
            {rules.map((rule) => {
              const RuleIcon =
                rule.status === "success"
                  ? ShieldCheck
                  : rule.status === "warning"
                    ? AlertTriangle
                    : AlertTriangle;
              return (
                <div className={styles["rule"]} data-status={rule.status} key={rule.rule}>
                  <RuleIcon size={14} strokeWidth={1.8} />
                  <span>{rule.message}</span>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </section>

      <motion.button
        className={styles["saveButton"]}
        disabled={catalogueStatus !== "ready"}
        onClick={() => setSaveOpen(true)}
        type="button"
        whileTap={{ scale: 0.98 }}
      >
        <Save size={14} />
        SAVE CONFIGURATION
      </motion.button>

      <SaveBuildDialog onClose={() => setSaveOpen(false)} open={saveOpen} />
    </div>
  );
}
