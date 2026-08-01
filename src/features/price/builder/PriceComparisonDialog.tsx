"use client";

import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { BadgeDollarSign, LoaderCircle, PackageSearch, RefreshCw, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import {
  getSelectedHardware,
  type HardwareCategory,
  type SelectedComponents,
} from "@/features/builder/domain/hardware";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import type { PriceRange } from "../domain/price";
import { PriceComparisonContent } from "./PriceComparisonContent";
import styles from "./PriceComparisonShell.module.css";
import { PriceHardwareTabs } from "./PriceHardwareTabs";
import { formatPriceTimestamp } from "./priceFormat";
import { usePriceComparisonData } from "./usePriceComparison";

type PriceComparisonDialogProps = {
  readonly onClose: () => void;
  readonly open: boolean;
  readonly selectedComponents: SelectedComponents;
};

export function PriceComparisonDialog({
  onClose,
  open,
  selectedComponents,
}: PriceComparisonDialogProps) {
  const [category, setCategory] = useState<HardwareCategory>("gpu");
  const [range, setRange] = useState<PriceRange>("30D");
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const hardware = getSelectedHardware(selectedComponents, category);
  const { comparison, comparisonStatus, error, history, historyStatus, retry } =
    usePriceComparisonData(hardware?.id ?? null, open, range);
  const closeDialog = useCallback(() => {
    setCategory("gpu");
    setRange("30D");
    onClose();
  }, [onClose]);

  useDialogFocus({
    dialogRef,
    initialFocusRef: closeButtonRef,
    isolationRootRef: backdropRef,
    onClose: closeDialog,
    open,
  });

  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {open ? (
          <m.div
            animate={{ opacity: 1 }}
            className={styles["backdrop"]}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeDialog();
              }
            }}
            ref={backdropRef}
          >
            <m.section
              animate={{ opacity: 1, scale: 1, y: 0 }}
              aria-label="价格智能"
              aria-modal="true"
              className={styles["dialog"]}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              initial={{ opacity: 0, scale: 0.98, y: 16 }}
              ref={dialogRef}
              role="dialog"
              tabIndex={-1}
              transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <header className={styles["dialogHeader"]}>
                <div className={styles["dialogIdentity"]}>
                  <span>
                    <BadgeDollarSign size={20} strokeWidth={1.5} />
                  </span>
                  <div>
                    <small>PRICE INTELLIGENCE</small>
                    <h2 id="price-dialog-title">{hardware?.name ?? "选择硬件查看报价"}</h2>
                  </div>
                </div>
                <button
                  aria-label="关闭比价"
                  className={styles["closeButton"]}
                  onClick={closeDialog}
                  ref={closeButtonRef}
                  type="button"
                >
                  <X size={18} />
                </button>
              </header>

              <PriceHardwareTabs
                activeCategory={category}
                onChange={setCategory}
                selectedComponents={selectedComponents}
              />

              {!hardware ? (
                <DialogState
                  detail="先在装机面板中选择该类别硬件，再查看平台报价。"
                  icon="empty"
                  title="该类别尚未选择硬件"
                />
              ) : comparisonStatus === "loading" && comparison === null ? (
                <DialogState
                  detail="正在同步优惠、可信分与历史价格。"
                  icon="loading"
                  title="正在校验人工报价"
                />
              ) : comparisonStatus === "error" ? (
                <DialogState detail={error} icon="error" onRetry={retry} title="价格服务连接失败" />
              ) : comparison ? (
                <PriceComparisonContent
                  comparison={comparison}
                  history={history}
                  historyStatus={historyStatus}
                  onRangeChange={setRange}
                  range={range}
                />
              ) : null}

              {comparison ? (
                <footer className={styles["disclosure"]}>
                  <span>
                    {comparison.disclosure} 价格与库存以跳转后的平台页面为准；购买按钮为联盟跳转。
                  </span>
                  <div>
                    <small>{formatPriceTimestamp(comparison.updatedAt)}</small>
                    <strong>{comparison.dataMode === "MANUAL" ? "人工维护" : "平台同步"}</strong>
                  </div>
                </footer>
              ) : null}
            </m.section>
          </m.div>
        ) : null}
      </AnimatePresence>
    </LazyMotion>
  );
}

type DialogStateProps = {
  readonly detail: string;
  readonly icon: "empty" | "error" | "loading";
  readonly onRetry?: () => void;
  readonly title: string;
};

function DialogState({ detail, icon, onRetry, title }: DialogStateProps) {
  return (
    <div
      className={styles["dialogState"]}
      data-kind={icon}
      role={icon === "error" ? "alert" : "status"}
    >
      {icon === "loading" ? (
        <LoaderCircle size={28} />
      ) : icon === "empty" ? (
        <PackageSearch size={28} />
      ) : null}
      <strong>{title}</strong>
      <span>{detail}</span>
      {onRetry ? (
        <button onClick={onRetry} type="button">
          <RefreshCw size={15} />
          重新加载
        </button>
      ) : null}
    </div>
  );
}
