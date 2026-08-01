// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptySelectedComponents } from "@/features/builder/domain/hardware";
import {
  deletePriceAlert,
  getOfferRedirectUrl,
  getPriceAlerts,
  getPriceComparison,
  getPriceHistory,
  upsertPriceAlert,
} from "../api/PriceApiClient";
import type { PriceComparison, PriceHistory } from "../domain/price";
import { PriceComparisonDialog } from "./PriceComparisonDialog";
import { comparison, cpu, deferred, gpu, history, nextGpu } from "./PriceComparisonDialog.fixtures";

vi.mock("../api/PriceApiClient", () => ({
  deletePriceAlert: vi.fn(),
  getOfferRedirectUrl: vi.fn((path: string) => `http://127.0.0.1:8088${path}?source=BUILDER`),
  getPriceAlerts: vi.fn(),
  getPriceComparison: vi.fn(),
  getPriceHistory: vi.fn(),
  upsertPriceAlert: vi.fn(),
}));

const selectedComponents = { ...emptySelectedComponents(), cpu, gpu };

describe("PriceComparisonDialog request isolation", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.mocked(getPriceComparison).mockReset().mockResolvedValue(comparison);
    vi.mocked(getPriceHistory).mockReset().mockResolvedValue(history);
    vi.mocked(getPriceAlerts).mockReset().mockResolvedValue([]);
    vi.mocked(upsertPriceAlert).mockReset();
    vi.mocked(deletePriceAlert).mockReset();
    vi.mocked(getOfferRedirectUrl).mockClear();
  });

  it("refetches when the selected hardware changes", async () => {
    const { rerender } = render(
      <PriceComparisonDialog onClose={vi.fn()} open selectedComponents={selectedComponents} />,
    );
    await screen.findByRole("heading", { name: "NVIDIA GeForce RTX 5090" });

    rerender(
      <PriceComparisonDialog
        onClose={vi.fn()}
        open
        selectedComponents={{ ...emptySelectedComponents(), gpu: nextGpu }}
      />,
    );

    await waitFor(() => {
      expect(getPriceComparison).toHaveBeenLastCalledWith("gpu-nvidia-rtx5080");
    });
  });

  it("ignores a slow response from the previously selected hardware", async () => {
    const gpuRequest = deferred<PriceComparison>();
    const cpuRequest = deferred<PriceComparison>();
    const reliableOffer = comparison.offers.find(
      (offer) => offer.id === comparison.recommendedOfferId,
    );
    if (reliableOffer === undefined) {
      throw new Error("Price fixture requires a reliable offer");
    }
    vi.mocked(getPriceComparison).mockImplementation((hardwareId) =>
      hardwareId === "cpu-intel-i9-14900k" ? cpuRequest.promise : gpuRequest.promise,
    );

    render(
      <PriceComparisonDialog onClose={vi.fn()} open selectedComponents={selectedComponents} />,
    );
    await waitFor(() => {
      expect(getPriceComparison).toHaveBeenCalledWith("gpu-nvidia-rtx5090");
    });
    fireEvent.click(screen.getByRole("button", { name: "CPU · Intel Core i9-14900K" }));
    cpuRequest.resolve({
      ...comparison,
      hardwareKey: "cpu-intel-i9-14900k",
      hardwareName: "Intel Core i9-14900K",
      offers: [{ ...reliableOffer, id: 7, seller: "CPU 可靠商家" }],
      lowestOfferId: 7,
      recommendedOfferId: 7,
    });
    expect((await screen.findAllByText("CPU 可靠商家")).length).toBeGreaterThan(0);

    gpuRequest.resolve(comparison);
    await waitFor(() => {
      expect(screen.getAllByText("CPU 可靠商家").length).toBeGreaterThan(0);
      expect(screen.queryByText("显卡严选店")).toBeNull();
    });
  });

  it("ignores slow history from a previously selected range", async () => {
    const thirtyDayRequest = deferred<PriceHistory>();
    const sevenDayRequest = deferred<PriceHistory>();
    vi.mocked(getPriceHistory).mockImplementation((_hardwareId, range) =>
      range === "7D" ? sevenDayRequest.promise : thirtyDayRequest.promise,
    );

    render(
      <PriceComparisonDialog onClose={vi.fn()} open selectedComponents={selectedComponents} />,
    );
    await screen.findByRole("heading", { name: "NVIDIA GeForce RTX 5090" });
    fireEvent.click(screen.getByRole("button", { name: "7 天" }));
    await waitFor(() => {
      expect(getPriceHistory).toHaveBeenLastCalledWith("gpu-nvidia-rtx5090", "7D");
    });

    sevenDayRequest.resolve({
      ...history,
      range: "7D",
      points: [
        { date: "2026-07-25", minimumPrice: 18199, offerCount: 2 },
        { date: "2026-07-31", minimumPrice: 17999, offerCount: 3 },
      ],
      lowestPrice: 17999,
      highestPrice: 18199,
      changePercent: -9.87,
    });
    expect(await screen.findByText("-9.87%")).toBeTruthy();

    thirtyDayRequest.resolve(history);
    await waitFor(() => {
      expect(screen.getByText("-9.87%")).toBeTruthy();
      expect(screen.queryByText("-2.22%")).toBeNull();
    });
  });

  it("reopens with the default GPU and 30-day range without stale requests", async () => {
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <div>
          <button onClick={() => setOpen(true)} type="button">
            重新打开比价
          </button>
          <PriceComparisonDialog
            onClose={() => setOpen(false)}
            open={open}
            selectedComponents={selectedComponents}
          />
        </div>
      );
    }
    render(<Harness />);
    await screen.findByRole("heading", { name: "NVIDIA GeForce RTX 5090" });
    fireEvent.click(screen.getByRole("button", { name: "CPU · Intel Core i9-14900K" }));
    fireEvent.click(await screen.findByRole("button", { name: "7 天" }));
    await waitFor(() => {
      expect(getPriceHistory).toHaveBeenLastCalledWith("cpu-intel-i9-14900k", "7D");
    });
    fireEvent.click(screen.getByRole("button", { name: "关闭比价" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    vi.mocked(getPriceComparison).mockClear();
    vi.mocked(getPriceHistory).mockClear();
    fireEvent.click(screen.getByRole("button", { name: "重新打开比价" }));
    await waitFor(() => {
      expect(getPriceComparison).toHaveBeenCalledWith("gpu-nvidia-rtx5090");
      expect(getPriceHistory).toHaveBeenCalledWith("gpu-nvidia-rtx5090", "30D");
    });
    expect(getPriceComparison).not.toHaveBeenCalledWith("cpu-intel-i9-14900k");
    expect(getPriceHistory).not.toHaveBeenCalledWith("cpu-intel-i9-14900k", "7D");
  });
});
