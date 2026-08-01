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

type BuildQuoteResult = {
  readonly quote: BuildQuote | null;
  readonly signature: string;
  readonly status: BuildQuoteStatus;
};

const inFlightBuildQuotes = new Map<string, Promise<BuildQuote>>();

const createHardwareSignature = (hardwareKeys: readonly string[]): string =>
  hardwareKeys.map(encodeURIComponent).join("&");

const requestBuildQuote = (signature: string, force: boolean): Promise<BuildQuote> => {
  if (!force) {
    const existingRequest = inFlightBuildQuotes.get(signature);
    if (existingRequest !== undefined) {
      return existingRequest;
    }
  }

  const hardwareKeys = signature.split("&").map(decodeURIComponent);
  const request = getBuildQuote(hardwareKeys);

  if (!force) {
    inFlightBuildQuotes.set(signature, request);
    const clearRequest = (): void => {
      if (inFlightBuildQuotes.get(signature) === request) {
        inFlightBuildQuotes.delete(signature);
      }
    };
    void request.then(clearRequest, clearRequest);
  }

  return request;
};

export function useBuildQuote(hardwareKeys: readonly string[]): BuildQuoteState {
  const signature = createHardwareSignature(hardwareKeys);
  const [result, setResult] = useState<BuildQuoteResult>({
    quote: null,
    signature,
    status: signature === "" ? "idle" : "loading",
  });
  const requestRevision = useRef(0);

  const load = useCallback(
    async (force: boolean): Promise<void> => {
      const revision = ++requestRevision.current;

      if (signature === "") {
        setResult({ quote: null, signature, status: "idle" });
        return;
      }

      setResult({ quote: null, signature, status: "loading" });

      try {
        const quote = await requestBuildQuote(signature, force);
        if (revision !== requestRevision.current) {
          return;
        }
        setResult({ quote, signature, status: "success" });
      } catch {
        if (revision !== requestRevision.current) {
          return;
        }
        setResult({ quote: null, signature, status: "error" });
      }
    },
    [signature],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    return () => {
      requestRevision.current += 1;
    };
  }, []);

  const retry = useCallback(() => {
    void load(true);
  }, [load]);

  if (result.signature !== signature) {
    return {
      quote: null,
      retry,
      status: signature === "" ? "idle" : "loading",
    };
  }

  return { quote: result.quote, retry, status: result.status };
}
