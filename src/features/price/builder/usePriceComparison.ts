"use client";

import { useCallback, useEffect, useState } from "react";
import type { HardwareId } from "@/features/builder/domain/hardware";
import { getPriceComparison, getPriceHistory } from "../api/PriceApiClient";
import type { PriceComparison, PriceHistory, PriceRange } from "../domain/price";

export type PriceLoadStatus = "idle" | "loading" | "ready" | "error";

type PriceComparisonState = {
  readonly comparison: PriceComparison | null;
  readonly comparisonStatus: PriceLoadStatus;
  readonly error: string;
  readonly history: PriceHistory | null;
  readonly historyStatus: PriceLoadStatus;
  readonly retry: () => void;
};

const toMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "价格服务暂时不可用。";

export function usePriceComparisonData(
  hardwareId: HardwareId | null,
  open: boolean,
  range: PriceRange,
): PriceComparisonState {
  const [comparison, setComparison] = useState<PriceComparison | null>(null);
  const [history, setHistory] = useState<PriceHistory | null>(null);
  const [comparisonStatus, setComparisonStatus] = useState<PriceLoadStatus>("idle");
  const [historyStatus, setHistoryStatus] = useState<PriceLoadStatus>("idle");
  const [error, setError] = useState("");

  const loadComparison = useCallback(async () => {
    if (!open || hardwareId === null) {
      return;
    }
    setComparisonStatus("loading");
    setError("");
    try {
      setComparison(await getPriceComparison(hardwareId));
      setComparisonStatus("ready");
    } catch (caught) {
      setError(toMessage(caught));
      setComparisonStatus("error");
    }
  }, [hardwareId, open]);

  const loadHistory = useCallback(async () => {
    if (!open || hardwareId === null) {
      return;
    }
    setHistoryStatus("loading");
    try {
      setHistory(await getPriceHistory(hardwareId, range));
      setHistoryStatus("ready");
    } catch {
      setHistory(null);
      setHistoryStatus("error");
    }
  }, [hardwareId, open, range]);

  useEffect(() => {
    void loadComparison();
  }, [loadComparison]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return {
    comparison,
    comparisonStatus,
    error,
    history,
    historyStatus,
    retry: () => {
      void loadComparison();
      void loadHistory();
    },
  };
}
