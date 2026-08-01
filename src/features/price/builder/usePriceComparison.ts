"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  readonly retryHistory: () => void;
};

type ComparisonSignature = Readonly<{
  hardwareId: HardwareId | null;
  open: boolean;
}>;

type HistorySignature = ComparisonSignature & Readonly<{ range: PriceRange }>;

type ComparisonResult = {
  readonly comparison: PriceComparison | null;
  readonly error: string;
  readonly signature: ComparisonSignature;
  readonly status: PriceLoadStatus;
};

type HistoryResult = {
  readonly history: PriceHistory | null;
  readonly signature: HistorySignature;
  readonly status: PriceLoadStatus;
};

const comparisonMatches = (left: ComparisonSignature, right: ComparisonSignature): boolean =>
  left.open === right.open && left.hardwareId === right.hardwareId;

const historyMatches = (left: HistorySignature, right: HistorySignature): boolean =>
  comparisonMatches(left, right) && left.range === right.range;

const initialStatus = (signature: ComparisonSignature): PriceLoadStatus =>
  signature.open && signature.hardwareId !== null ? "loading" : "idle";

const toMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "价格服务暂时不可用。";

export function usePriceComparisonData(
  hardwareId: HardwareId | null,
  open: boolean,
  range: PriceRange,
): PriceComparisonState {
  const comparisonSignature = useMemo<ComparisonSignature>(
    () => ({ hardwareId, open }),
    [hardwareId, open],
  );
  const historySignature = useMemo<HistorySignature>(
    () => ({ hardwareId, open, range }),
    [hardwareId, open, range],
  );
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult>(() => ({
    comparison: null,
    error: "",
    signature: comparisonSignature,
    status: initialStatus(comparisonSignature),
  }));
  const [historyResult, setHistoryResult] = useState<HistoryResult>(() => ({
    history: null,
    signature: historySignature,
    status: initialStatus(historySignature),
  }));
  const comparisonRequest = useRef(0);
  const historyRequest = useRef(0);

  const loadComparison = useCallback(async () => {
    const requestId = ++comparisonRequest.current;
    if (!comparisonSignature.open || comparisonSignature.hardwareId === null) {
      setComparisonResult({
        comparison: null,
        error: "",
        signature: comparisonSignature,
        status: "idle",
      });
      return;
    }
    setComparisonResult({
      comparison: null,
      error: "",
      signature: comparisonSignature,
      status: "loading",
    });
    try {
      const response = await getPriceComparison(comparisonSignature.hardwareId);
      if (requestId !== comparisonRequest.current) {
        return;
      }
      setComparisonResult({
        comparison: response,
        error: "",
        signature: comparisonSignature,
        status: "ready",
      });
    } catch (caught) {
      if (requestId !== comparisonRequest.current) {
        return;
      }
      setComparisonResult({
        comparison: null,
        error: toMessage(caught),
        signature: comparisonSignature,
        status: "error",
      });
    }
  }, [comparisonSignature]);

  const loadHistory = useCallback(async () => {
    const requestId = ++historyRequest.current;
    if (!historySignature.open || historySignature.hardwareId === null) {
      setHistoryResult({ history: null, signature: historySignature, status: "idle" });
      return;
    }
    setHistoryResult({ history: null, signature: historySignature, status: "loading" });
    try {
      const response = await getPriceHistory(historySignature.hardwareId, historySignature.range);
      if (requestId !== historyRequest.current) {
        return;
      }
      setHistoryResult({ history: response, signature: historySignature, status: "ready" });
    } catch {
      if (requestId !== historyRequest.current) {
        return;
      }
      setHistoryResult({ history: null, signature: historySignature, status: "error" });
    }
  }, [historySignature]);

  useEffect(() => {
    void loadComparison();
    return () => {
      comparisonRequest.current += 1;
    };
  }, [loadComparison]);

  useEffect(() => {
    void loadHistory();
    return () => {
      historyRequest.current += 1;
    };
  }, [loadHistory]);

  const comparisonOwned = comparisonMatches(comparisonResult.signature, comparisonSignature);
  const historyOwned = historyMatches(historyResult.signature, historySignature);
  const comparisonStatus = comparisonOwned
    ? comparisonResult.status
    : initialStatus(comparisonSignature);
  const historyStatus = historyOwned ? historyResult.status : initialStatus(historySignature);

  return {
    comparison: comparisonOwned ? comparisonResult.comparison : null,
    comparisonStatus,
    error: comparisonOwned ? comparisonResult.error : "",
    history: historyOwned ? historyResult.history : null,
    historyStatus,
    retry: () => {
      void loadComparison();
      void loadHistory();
    },
    retryHistory: () => void loadHistory(),
  };
}
