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
  observeFirstSignatureCommit,
  oldHardwareId,
} from "./priceComparisonTestSupport";

vi.mock("../api/PriceApiClient", () => ({
  getPriceComparison: vi.fn(),
  getPriceHistory: vi.fn(),
}));

describe("usePriceComparisonData committed signatures", () => {
  beforeEach(() => {
    vi.mocked(getPriceComparison).mockReset();
    vi.mocked(getPriceHistory).mockReset();
  });

  it("hides ready old content and chart in the first new-hardware commit", async () => {
    const newComparisonRequest = deferred<PriceComparison>();
    const newHistoryRequest = deferred<PriceHistory>();
    const testRoot = createComparisonTestRoot();
    vi.mocked(getPriceComparison).mockImplementation((hardwareId) =>
      hardwareId === newHardwareId ? newComparisonRequest.promise : Promise.resolve(comparison),
    );
    vi.mocked(getPriceHistory).mockImplementation((hardwareId) =>
      hardwareId === newHardwareId ? newHistoryRequest.promise : Promise.resolve(history),
    );

    try {
      testRoot.root.render(<PriceComparisonTestHarness hardwareId={oldHardwareId} range="30D" />);
      await waitFor(() =>
        expect(testRoot.container.textContent).toContain(comparison.hardwareName),
      );
      await waitFor(() =>
        expect(testRoot.container.querySelector('[aria-label="30D 价格趋势"]')).not.toBeNull(),
      );
      const firstNewCommit = observeFirstSignatureCommit(
        testRoot.container,
        `${newHardwareId}:30D`,
      );

      testRoot.root.render(<PriceComparisonTestHarness hardwareId={newHardwareId} range="30D" />);
      const firstNewMarkup = await firstNewCommit;

      expect(firstNewMarkup).not.toContain(comparison.hardwareName);
      expect(firstNewMarkup).not.toContain('aria-label="30D 价格趋势"');
      newComparisonRequest.resolve(newComparison);
      newHistoryRequest.resolve({ ...history, hardwareKey: newHardwareId });
    } finally {
      testRoot.unmount();
    }
  });

  it("hides an old error in the first new-hardware commit", async () => {
    const newComparisonRequest = deferred<PriceComparison>();
    const newHistoryRequest = deferred<PriceHistory>();
    const testRoot = createComparisonTestRoot();
    vi.mocked(getPriceComparison).mockImplementation((hardwareId) =>
      hardwareId === newHardwareId
        ? newComparisonRequest.promise
        : Promise.reject(new Error("old comparison failure")),
    );
    vi.mocked(getPriceHistory).mockImplementation((hardwareId) =>
      hardwareId === newHardwareId ? newHistoryRequest.promise : Promise.resolve(history),
    );

    try {
      testRoot.root.render(<PriceComparisonTestHarness hardwareId={oldHardwareId} range="30D" />);
      await waitFor(() =>
        expect(testRoot.container.textContent).toContain("old comparison failure"),
      );
      const firstNewCommit = observeFirstSignatureCommit(
        testRoot.container,
        `${newHardwareId}:30D`,
      );

      testRoot.root.render(<PriceComparisonTestHarness hardwareId={newHardwareId} range="30D" />);
      const firstNewMarkup = await firstNewCommit;

      expect(firstNewMarkup).not.toContain("old comparison failure");
      expect(firstNewMarkup).not.toContain('role="alert"');
      newComparisonRequest.resolve(newComparison);
      newHistoryRequest.resolve({ ...history, hardwareKey: newHardwareId });
    } finally {
      testRoot.unmount();
    }
  });

  it("hides ready 30-day history in the first 90-day commit", async () => {
    const ninetyDayRequest = deferred<PriceHistory>();
    const testRoot = createComparisonTestRoot();
    vi.mocked(getPriceComparison).mockResolvedValue(comparison);
    vi.mocked(getPriceHistory).mockImplementation((_hardwareId, range) =>
      range === "90D" ? ninetyDayRequest.promise : Promise.resolve(history),
    );

    try {
      testRoot.root.render(<PriceComparisonTestHarness hardwareId={oldHardwareId} range="30D" />);
      await waitFor(() =>
        expect(testRoot.container.querySelector('[aria-label="30D 价格趋势"]')).not.toBeNull(),
      );
      const firstNinetyDayCommit = observeFirstSignatureCommit(
        testRoot.container,
        `${oldHardwareId}:90D`,
      );

      testRoot.root.render(<PriceComparisonTestHarness hardwareId={oldHardwareId} range="90D" />);
      const firstNinetyDayMarkup = await firstNinetyDayCommit;

      expect(firstNinetyDayMarkup).not.toContain('aria-label="30D 价格趋势"');
      ninetyDayRequest.resolve(ninetyDayHistory);
    } finally {
      testRoot.unmount();
    }
  });
});
