"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const comparisonRequest = useRef(0);
  const historyRequest = useRef(0);
  const currentContext = useRef({ hardwareId, open, range });
  currentContext.current = { hardwareId, open, range };

  const loadComparison = useCallback(async () => {
    const requestId = ++comparisonRequest.current;
    if (!open || hardwareId === null) {
      setComparison(null);
      setComparisonStatus("idle");
      setError("");
      return;
    }
    setComparison(null);
    setComparisonStatus("loading");
    setError("");
    try {
      const response = await getPriceComparison(hardwareId);
      const context = currentContext.current;
      if (
        requestId !== comparisonRequest.current ||
        !context.open ||
        context.hardwareId !== hardwareId
      ) {
        return;
      }
      setComparison(response);
      setComparisonStatus("ready");
    } catch (caught) {
      const context = currentContext.current;
      if (
        requestId !== comparisonRequest.current ||
        !context.open ||
        context.hardwareId !== hardwareId
      ) {
        return;
      }
      setError(toMessage(caught));
      setComparisonStatus("error");
    }
  }, [hardwareId, open]);

  const loadHistory = useCallback(async () => {
    const requestId = ++historyRequest.current;
    if (!open || hardwareId === null) {
      setHistory(null);
      setHistoryStatus("idle");
      return;
    }
    setHistory(null);
    setHistoryStatus("loading");
    try {
      const response = await getPriceHistory(hardwareId, range);
      const context = currentContext.current;
      if (
        requestId !== historyRequest.current ||
        !context.open ||
        context.hardwareId !== hardwareId ||
        context.range !== range
      ) {
        return;
      }
      setHistory(response);
      setHistoryStatus("ready");
    } catch {
      const context = currentContext.current;
      if (
        requestId !== historyRequest.current ||
        !context.open ||
        context.hardwareId !== hardwareId ||
        context.range !== range
      ) {
        return;
      }
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
