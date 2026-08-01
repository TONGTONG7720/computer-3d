// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptySelectedComponents } from "@/features/builder/domain/hardware";
import { getOfferRedirectUrl, getPriceComparison, getPriceHistory } from "../api/PriceApiClient";
import type { PriceComparison, PriceHistory } from "../domain/price";
import { PriceComparisonDialog } from "./PriceComparisonDialog";
import { comparison, cpu, deferred, gpu, history, nextGpu } from "./PriceComparisonDialog.fixtures";

vi.mock("../api/PriceApiClient", () => ({
  getOfferRedirectUrl: vi.fn((path: string) => `http://127.0.0.1:8088${path}?source=BUILDER`),
  getPriceComparison: vi.fn(),
  getPriceHistory: vi.fn(),
}));

const selectedComponents = {
  ...emptySelectedComponents(),
  cpu,
  gpu,
};

describe("PriceComparisonDialog", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(getPriceComparison).mockReset();
    vi.mocked(getPriceHistory).mockReset();
    vi.mocked(getOfferRedirectUrl).mockClear();
    vi.mocked(getPriceComparison).mockResolvedValue(comparison);
    vi.mocked(getPriceHistory).mockResolvedValue(history);
  });

  it("distinguishes the lowest offer from the reliable recommendation", async () => {
    render(
      <PriceComparisonDialog onClose={vi.fn()} open selectedComponents={selectedComponents} />,
    );

    expect(await screen.findByRole("heading", { name: "NVIDIA GeForce RTX 5090" })).toBeTruthy();
    expect(screen.getByText("最低价")).toBeTruthy();
    expect(screen.getByText("可靠推荐")).toBeTruthy();
    expect(screen.getByText("数据可能过期")).toBeTruthy();
    expect(screen.getAllByText(/免运费/).length).toBeGreaterThan(0);
    expect(screen.getByText(/销量 428/)).toBeTruthy();
    expect(screen.getByText(/更新于/)).toBeTruthy();
    expect(screen.getByText(/联盟跳转/)).toBeTruthy();

    const purchaseLink = screen.getByRole("link", { name: "前往京东购买" });
    expect(purchaseLink.getAttribute("href")).toContain("/offers/2/go?source=BUILDER");
    expect(purchaseLink.getAttribute("target")).toBe("_blank");
    expect(purchaseLink.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("reloads trend data when switching between 30 and 7 days", async () => {
    render(
      <PriceComparisonDialog onClose={vi.fn()} open selectedComponents={selectedComponents} />,
    );
    await screen.findByLabelText("RTX 5090 价格趋势");

    fireEvent.click(screen.getByRole("button", { name: "7 天" }));

    await waitFor(() => {
      expect(getPriceHistory).toHaveBeenLastCalledWith("gpu-nvidia-rtx5090", "7D");
    });
  });

  it("shows an explicit empty state when no reviewed offers exist", async () => {
    vi.mocked(getPriceComparison).mockResolvedValue({
      ...comparison,
      lowestPrice: null,
      lowestOfferId: null,
      recommendedOfferId: null,
      priceRange: null,
      offers: [],
    });

    render(
      <PriceComparisonDialog onClose={vi.fn()} open selectedComponents={selectedComponents} />,
    );

    expect(await screen.findByText("暂无可购买报价")).toBeTruthy();
    expect(screen.getByText("仍可使用内部参考价完成配置。")).toBeTruthy();
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
        selectedComponents={{
          ...emptySelectedComponents(),
          gpu: nextGpu,
        }}
      />,
    );

    await waitFor(() => {
      expect(getPriceComparison).toHaveBeenLastCalledWith("gpu-nvidia-rtx5080");
    });
  });

  it("opens on GPU and switches across all selected hardware categories", async () => {
    render(
      <PriceComparisonDialog onClose={vi.fn()} open selectedComponents={selectedComponents} />,
    );

    await waitFor(() => {
      expect(getPriceComparison).toHaveBeenCalledWith("gpu-nvidia-rtx5090");
    });
    fireEvent.click(screen.getByRole("button", { name: "CPU · Intel Core i9-14900K" }));

    await waitFor(() => {
      expect(getPriceComparison).toHaveBeenLastCalledWith("cpu-intel-i9-14900k");
    });
    expect(screen.getByRole("button", { name: "GPU · NVIDIA GeForce RTX 5090" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "CPU · Intel Core i9-14900K" })).toBeTruthy();
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

  it("traps focus and restores it to the launch control when closed", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button onClick={() => setOpen(true)} type="button">
            打开比价
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
    const launcher = screen.getByRole("button", { name: "打开比价" });

    launcher.focus();
    fireEvent.click(launcher);
    const closeButton = await screen.findByRole("button", { name: "关闭比价" });
    expect(document.activeElement).toBe(closeButton);
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(launcher);
    });
  });
});
