"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeDollarSign,
  Check,
  Database,
  LoaderCircle,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useBuilderStore } from "@/store/builderStore";
import { isReplacementBusy, useEngineStore } from "@/store/engineStore";
import { evaluateCompatibility } from "../domain/CompatibilityEngine";
import {
  formatHardwareSpec,
  getSelectedHardware,
  type Hardware,
  replaceSelectedHardware,
} from "../domain/hardware";
import { selectBuilderHardwareWithScene } from "../sync/BuilderEngineSync";
import { categoryDefinitions, findCategoryDefinition } from "./BuilderIcons";
import styles from "./ComponentSelector.module.css";
import { RecommendationDialog } from "./RecommendationDialog";
import { SaveBuildDialog } from "./SaveBuildDialog";

type HardwareCardProps = {
  readonly hardware: Hardware;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly compatibility: "success" | "warning" | "error";
  readonly onSelect: () => void;
};

type CatalogueStateProps = {
  readonly error: string | null;
  readonly loading: boolean;
  readonly onRetry: () => void;
};

type ComponentSelectorProps = {
  readonly onOpenPrices: () => void;
};

function CatalogueState({ error, loading, onRetry }: CatalogueStateProps) {
  return (
    <div className={styles["catalogueState"]} role={error === null ? "status" : "alert"}>
      {loading ? (
        <LoaderCircle className={styles["loadingIcon"]} size={22} strokeWidth={1.5} />
      ) : (
        <Database size={22} strokeWidth={1.5} />
      )}
      <strong>{loading ? "SYNCING HARDWARE DATA" : "HARDWARE SERVICE OFFLINE"}</strong>
      <span>{loading ? "正在读取 MySQL 硬件目录与模型信息。" : error}</span>
      {!loading ? (
        <button className={styles["retryButton"]} onClick={onRetry} type="button">
          <RefreshCw size={13} />
          RETRY CONNECTION
        </button>
      ) : null}
    </div>
  );
}

function HardwareCard({
  hardware,
  selected,
  disabled,
  compatibility,
  onSelect,
}: HardwareCardProps) {
  const definition = findCategoryDefinition(hardware.category);
  const Icon = definition.icon;
  const StatusIcon = compatibility === "success" ? Check : AlertTriangle;

  return (
    <motion.button
      aria-pressed={selected}
      className={styles["hardwareCard"]}
      data-hardware-id={hardware.id}
      data-selected={selected}
      data-status={compatibility}
      disabled={disabled || selected}
      onClick={onSelect}
      type="button"
      whileHover={disabled || selected ? {} : { y: -2 }}
      whileTap={disabled || selected ? {} : { scale: 0.985 }}
    >
      <span className={styles["visual"]}>
        <Icon size={23} strokeWidth={1.35} />
      </span>
      <span className={styles["copy"]}>
        <span className={styles["brand"]}>{hardware.brand}</span>
        <strong className={styles["name"]}>{hardware.name}</strong>
        <span className={styles["spec"]}>{formatHardwareSpec(hardware)}</span>
        <span className={styles["cardFooter"]}>
          <span className={styles["performance"]}>
            P{hardware.performance}
            <span className={styles["performanceTrack"]}>
              <motion.span animate={{ scaleX: hardware.performance / 100 }} initial={false} />
            </span>
          </span>
          <strong className={styles["price"]}>¥{hardware.price.toLocaleString("zh-CN")}</strong>
        </span>
      </span>
      <span className={styles["statusIcon"]} data-status={compatibility}>
        <StatusIcon size={12} strokeWidth={2.2} />
      </span>
    </motion.button>
  );
}

export function ComponentSelector({ onOpenPrices }: ComponentSelectorProps) {
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const selectedComponents = useBuilderStore((state) => state.selectedComponents);
  const catalogue = useBuilderStore((state) => state.catalogue);
  const catalogueStatus = useBuilderStore((state) => state.catalogueStatus);
  const catalogueError = useBuilderStore((state) => state.catalogueError);
  const retryCatalogue = useBuilderStore((state) => state.retryCatalogue);
  const activeCategory = useBuilderStore((state) => state.activeCategory);
  const feedback = useBuilderStore((state) => state.feedback);
  const setActiveCategory = useBuilderStore((state) => state.setActiveCategory);
  const replacementState = useEngineStore((state) => state.replacementState);
  const replacementRequest = useEngineStore((state) => state.replacementRequest);
  const definition = findCategoryDefinition(activeCategory);
  const options = catalogue.filter((hardware) => hardware.category === activeCategory);
  const selected = getSelectedHardware(selectedComponents, activeCategory);
  const busy = isReplacementBusy(replacementState.phase) || replacementRequest !== null;

  return (
    <div className={styles["root"]}>
      <header className={styles["header"]}>
        <div>
          <p className={styles["eyebrow"]}>COMPONENT BAY</p>
          <h1>Configure architecture</h1>
          <span>八类硬件实时联动。</span>
        </div>
        <div className={styles["headerActions"]}>
          <motion.button
            className={styles["smartButton"]}
            disabled={catalogueStatus !== "ready"}
            onClick={() => setRecommendationOpen(true)}
            type="button"
            whileTap={{ scale: 0.97 }}
          >
            <Sparkles size={13} />
            SMART BUILD
          </motion.button>
          <motion.button
            aria-label="保存当前配置"
            className={styles["mobileSaveButton"]}
            disabled={catalogueStatus !== "ready"}
            onClick={() => setSaveOpen(true)}
            type="button"
            whileTap={{ scale: 0.97 }}
          >
            <Save size={14} />
          </motion.button>
          <motion.button
            aria-label="比较当前硬件价格"
            className={styles["mobilePriceButton"]}
            disabled={catalogueStatus !== "ready"}
            onClick={onOpenPrices}
            type="button"
            whileTap={{ scale: 0.97 }}
          >
            <BadgeDollarSign size={14} />
          </motion.button>
        </div>
      </header>

      <nav aria-label="硬件类别" className={styles["categoryTabs"]}>
        {categoryDefinitions.map((category) => {
          const Icon = category.icon;
          return (
            <button
              aria-label={category.label}
              className={styles["categoryTab"]}
              data-active={category.category === activeCategory}
              key={category.category}
              onClick={() => setActiveCategory(category.category)}
              title={category.label}
              type="button"
            >
              <Icon size={15} strokeWidth={1.5} />
              <span>{category.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles["sectionMeta"]}>
        <strong>{definition.label}</strong>
        <span>{options.length} OPTIONS · LIVE COMPATIBILITY</span>
      </div>

      <div aria-live="polite" className={styles["optionList"]}>
        {catalogueStatus === "ready" ? (
          options.map((hardware) => {
            const candidate = replaceSelectedHardware(selectedComponents, hardware);
            const compatibility = evaluateCompatibility(candidate).status;
            return (
              <HardwareCard
                compatibility={compatibility}
                disabled={busy}
                hardware={hardware}
                key={hardware.id}
                onSelect={() => selectBuilderHardwareWithScene(hardware)}
                selected={selected?.id === hardware.id}
              />
            );
          })
        ) : (
          <CatalogueState
            error={catalogueError}
            loading={catalogueStatus !== "error"}
            onRetry={() => {
              void retryCatalogue();
            }}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        {feedback.revision > 0 ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={styles["feedback"]}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0, y: 8 }}
            key={feedback.revision}
          >
            <span>CONFIG RECALCULATED</span>
            <strong>
              {feedback.priceDelta >= 0 ? "+" : "−"}¥
              {Math.abs(feedback.priceDelta).toLocaleString("zh-CN")} ·{" "}
              {feedback.scoreDelta >= 0 ? "+" : ""}
              {feedback.scoreDelta} PTS
            </strong>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <RecommendationDialog
        onClose={() => setRecommendationOpen(false)}
        open={recommendationOpen}
      />
      <SaveBuildDialog onClose={() => setSaveOpen(false)} open={saveOpen} />
    </div>
  );
}
