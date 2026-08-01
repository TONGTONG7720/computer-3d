// @vitest-environment jsdom

import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPriceComparison, getPriceHistory } from "../api/PriceApiClient";
import type { PriceComparison, PriceHistory } from "../domain/price";
import { comparison, deferred, history } from "./PriceComparisonDialog.fixtures";
import PriceComparisonTestHarness from "./PriceComparisonTestHarness";
import {
  createComparisonTestRoot,
  newComparison,
  newHardwareId,
  ninetyDayHistory,
  observeSignatureCommits,
  oldHardwareId,
} from "./priceComparisonTestSupport";

vi.mock("../api/PriceApiClient", () => ({
  getPriceComparison: vi.fn(),
  getPriceHistory: vi.fn(),
}));

describe("usePriceComparisonData pending signatures", () => {
  beforeEach(() => {
    vi.mocked(getPriceComparison).mockReset();
    vi.mocked(getPriceHistory).mockReset();
  });

  it("rejects old comparison and history resolved after new hardware commits", async () => {
    const oldComparisonRequest = deferred<PriceComparison>();
    const oldHistoryRequest = deferred<PriceHistory>();
    const newComparisonRequest = deferred<PriceComparison>();
    const newHistoryRequest = deferred<PriceHistory>();
    const testRoot = createComparisonTestRoot();
    vi.mocked(getPriceComparison).mockImplementation((hardwareId) =>
      hardwareId === newHardwareId ? newComparisonRequest.promise : oldComparisonRequest.promise,
    );
    vi.mocked(getPriceHistory).mockImplementation((hardwareId) =>
      hardwareId === newHardwareId ? newHistoryRequest.promise : oldHistoryRequest.promise,
    );

    try {
      testRoot.root.render(<PriceComparisonTestHarness hardwareId={oldHardwareId} range="30D" />);
      await waitFor(() => expect(getPriceComparison).toHaveBeenCalledWith(oldHardwareId));
      const commits = observeSignatureCommits(testRoot.container, `${newHardwareId}:30D`);
      testRoot.root.render(<PriceComparisonTestHarness hardwareId={newHardwareId} range="30D" />);
      await commits.firstCommit;
      oldComparisonRequest.resolve(comparison);
      oldHistoryRequest.resolve(history);
      await Promise.all([oldComparisonRequest.promise, oldHistoryRequest.promise]);
      await waitFor(() => expect(getPriceComparison).toHaveBeenCalledWith(newHardwareId));

      expect(commits.snapshots.every((markup) => !markup.includes(comparison.hardwareName))).toBe(
        true,
      );
      expect(commits.snapshots.every((markup) => !markup.includes("30D 价格趋势"))).toBe(true);
      commits.disconnect();
      newComparisonRequest.resolve(newComparison);
      newHistoryRequest.resolve({ ...history, hardwareKey: newHardwareId });
    } finally {
      testRoot.unmount();
    }
  });

  it("rejects old errors raised after new hardware commits", async () => {
    const oldComparisonRequest = deferred<PriceComparison>();
    const oldHistoryRequest = deferred<PriceHistory>();
    const newComparisonRequest = deferred<PriceComparison>();
    const newHistoryRequest = deferred<PriceHistory>();
    const testRoot = createComparisonTestRoot();
    vi.mocked(getPriceComparison).mockImplementation((hardwareId) =>
      hardwareId === newHardwareId ? newComparisonRequest.promise : oldComparisonRequest.promise,
    );
    vi.mocked(getPriceHistory).mockImplementation((hardwareId) =>
      hardwareId === newHardwareId ? newHistoryRequest.promise : oldHistoryRequest.promise,
    );

    try {
      testRoot.root.render(<PriceComparisonTestHarness hardwareId={oldHardwareId} range="30D" />);
      await waitFor(() => expect(getPriceComparison).toHaveBeenCalledWith(oldHardwareId));
      const commits = observeSignatureCommits(testRoot.container, `${newHardwareId}:30D`);
      testRoot.root.render(<PriceComparisonTestHarness hardwareId={newHardwareId} range="30D" />);
      await commits.firstCommit;
      oldComparisonRequest.reject(new Error("old comparison failure"));
      oldHistoryRequest.reject(new Error("old history failure"));
      await Promise.allSettled([oldComparisonRequest.promise, oldHistoryRequest.promise]);
      await waitFor(() => expect(getPriceComparison).toHaveBeenCalledWith(newHardwareId));

      expect(commits.snapshots.every((markup) => !markup.includes("old comparison failure"))).toBe(
        true,
      );
      expect(commits.snapshots.every((markup) => !markup.includes('role="alert"'))).toBe(true);
      commits.disconnect();
      newComparisonRequest.resolve(newComparison);
      newHistoryRequest.resolve({ ...history, hardwareKey: newHardwareId });
    } finally {
      testRoot.unmount();
    }
  });

  it("rejects 30-day history resolved after the 90-day range commits", async () => {
    const thirtyDayRequest = deferred<PriceHistory>();
    const ninetyDayRequest = deferred<PriceHistory>();
    const testRoot = createComparisonTestRoot();
    vi.mocked(getPriceComparison).mockResolvedValue(comparison);
    vi.mocked(getPriceHistory).mockImplementation((_hardwareId, range) =>
      range === "90D" ? ninetyDayRequest.promise : thirtyDayRequest.promise,
    );

    try {
      testRoot.root.render(<PriceComparisonTestHarness hardwareId={oldHardwareId} range="30D" />);
      await waitFor(() => expect(getPriceHistory).toHaveBeenCalledWith(oldHardwareId, "30D"));
      const commits = observeSignatureCommits(testRoot.container, `${oldHardwareId}:90D`);
      testRoot.root.render(<PriceComparisonTestHarness hardwareId={oldHardwareId} range="90D" />);
      await commits.firstCommit;
      thirtyDayRequest.resolve(history);
      await thirtyDayRequest.promise;
      await waitFor(() => expect(getPriceHistory).toHaveBeenCalledWith(oldHardwareId, "90D"));

      expect(commits.snapshots.every((markup) => !markup.includes("30D 价格趋势"))).toBe(true);
      commits.disconnect();
      ninetyDayRequest.resolve(ninetyDayHistory);
    } finally {
      testRoot.unmount();
    }
  });
});
