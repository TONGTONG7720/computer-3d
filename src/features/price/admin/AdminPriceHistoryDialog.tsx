"use client";

import { LoaderCircle, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { getPriceHistory } from "../api/PriceApiClient";
import { PriceTrendChart } from "../builder/PriceTrendChart";
import type { PriceHistory, PriceRange } from "../domain/price";
import controls from "./AdminControls.module.css";
import styles from "./AdminPriceHistoryDialog.module.css";
import { PriceChangeList } from "./PriceChangeList";

type AdminPriceHistoryDialogProps = {
  readonly hardwareId: string;
  readonly hardwareName: string;
  readonly onClose: () => void;
  readonly open: boolean;
};

export function AdminPriceHistoryDialog({
  hardwareId,
  hardwareName,
  onClose,
  open,
}: AdminPriceHistoryDialogProps) {
  const [range, setRange] = useState<PriceRange>("30D");
  const [history, setHistory] = useState<PriceHistory | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const requestRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeDialog = useCallback(onClose, [onClose]);
  useDialogFocus({
    dialogRef,
    initialFocusRef: closeRef,
    isolationRootRef: rootRef,
    onClose: closeDialog,
    open,
  });

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setHistory(null);
    setStatus("loading");
    try {
      const nextHistory = await getPriceHistory(hardwareId, range);
      if (requestRef.current === requestId) {
        setHistory(nextHistory);
        setStatus("ready");
      }
    } catch {
      if (requestRef.current === requestId) {
        setStatus("error");
      }
    }
  }, [hardwareId, range]);

  useEffect(() => {
    if (open) {
      void load();
    } else {
      requestRef.current += 1;
    }
  }, [load, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className={styles["backdrop"]} ref={rootRef}>
      <section
        aria-labelledby="admin-price-history-title"
        aria-modal="true"
        className={styles["dialog"]}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header>
          <div>
            <small>PRICE HISTORY</small>
            <h3 id="admin-price-history-title">{hardwareName}</h3>
          </div>
          <button
            aria-label="关闭价格历史"
            className={controls["iconButton"]}
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <X size={18} />
          </button>
        </header>
        <div className={styles["rangeSwitch"]}>
          <button aria-pressed={range === "7D"} onClick={() => setRange("7D")} type="button">
            7 天
          </button>
          <button aria-pressed={range === "30D"} onClick={() => setRange("30D")} type="button">
            30 天
          </button>
        </div>
        {status === "loading" ? (
          <div className={styles["state"]} role="status">
            <LoaderCircle size={22} />
            正在读取价格历史
          </div>
        ) : history ? (
          <>
            <PriceTrendChart ariaLabel={`${hardwareName} 运营价格趋势`} history={history} />
            <PriceChangeList changes={history.changes} />
          </>
        ) : (
          <div className={styles["state"]} role="alert">
            <span>价格历史暂时不可用</span>
            <button
              className={controls["secondaryButton"]}
              onClick={() => void load()}
              type="button"
            >
              <RefreshCw size={15} />
              重试
            </button>
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}
