"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBuildQuote } from "../api/PriceApiClient";
import type { BuildQuote } from "../domain/price";

export type BuildQuoteStatus = "idle" | "loading" | "success" | "error";

export type BuildQuoteState = {
  readonly quote: BuildQuote | null;
  readonly status: BuildQuoteStatus;
  readonly retry: () => void;
};

export function useBuildQuote(hardwareKeys: readonly string[]): BuildQuoteState {
  const [quote, setQuote] = useState<BuildQuote | null>(null);
  const [status, setStatus] = useState<BuildQuoteStatus>("idle");
  const requestRevision = useRef(0);

  const load = useCallback(async (): Promise<void> => {
    const revision = ++requestRevision.current;
    const requestedHardwareKeys = [...hardwareKeys];

    if (requestedHardwareKeys.length === 0) {
      setQuote(null);
      setStatus("idle");
      return;
    }

    setQuote(null);
    setStatus("loading");

    try {
      const response = await getBuildQuote(requestedHardwareKeys);
      if (revision !== requestRevision.current) {
        return;
      }
      setQuote(response);
      setStatus("success");
    } catch (caught) {
      if (revision !== requestRevision.current) {
        return;
      }
      if (caught instanceof Error) {
        setQuote(null);
        setStatus("error");
        return;
      }
      setQuote(null);
      setStatus("error");
    }
  }, [hardwareKeys]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      requestRevision.current += 1;
    };
  }, []);

  const retry = useCallback(() => {
    void load();
  }, [load]);

  return { quote, retry, status };
}
