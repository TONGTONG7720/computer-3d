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
import { PriceComparisonDialog } from "./PriceComparisonDialog";
import { comparison, cpu, gpu, history } from "./PriceComparisonDialog.fixtures";

vi.mock("../api/PriceApiClient", () => ({
  deletePriceAlert: vi.fn(),
  getOfferRedirectUrl: vi.fn((path: string) => `http://127.0.0.1:8088${path}?source=BUILDER`),
  getPriceAlerts: vi.fn(),
  getPriceComparison: vi.fn(),
  getPriceHistory: vi.fn(),
  upsertPriceAlert: vi.fn(),
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
    vi.mocked(getPriceAlerts).mockReset();
    vi.mocked(upsertPriceAlert).mockReset();
    vi.mocked(deletePriceAlert).mockReset();
    vi.mocked(getOfferRedirectUrl).mockClear();
    vi.mocked(getPriceComparison).mockResolvedValue(comparison);
    vi.mocked(getPriceHistory).mockResolvedValue(history);
    vi.mocked(getPriceAlerts).mockResolvedValue([]);
  });

  it("distinguishes the lowest offer from the reliable recommendation", async () => {
    const { container } = render(
      <PriceComparisonDialog onClose={vi.fn()} open selectedComponents={selectedComponents} />,
    );

    expect(await screen.findByRole("heading", { name: "NVIDIA GeForce RTX 5090" })).toBeTruthy();
    expect(screen.getAllByText("最低到手").length).toBeGreaterThan(0);
    expect(screen.getByText("推荐购买")).toBeTruthy();
    expect(screen.getByText("待核验")).toBeTruthy();
    expect(screen.getByText("商品匹配 98%")).toBeTruthy();
    expect(container.querySelector('[data-badge-tone="neutral"]')?.textContent).toBe("最低到手");
    expect(container.querySelector('[data-badge-tone="warning"]')?.textContent).toBe("待核验");
    expect(screen.getAllByText(/免运费/).length).toBeGreaterThan(0);
    expect(screen.getByText(/销量 428/)).toBeTruthy();
    expect(screen.getByText("京东物流 · 次日达（人工核验）")).toBeTruthy();
    expect(screen.getByText(/履约评分 88\/100/)).toBeTruthy();
    expect(screen.getAllByText(/人工演示数据/).length).toBeGreaterThan(0);
    expect(screen.getByText(/40%/)).toBeTruthy();
    expect(screen.getByText(/25%/)).toBeTruthy();
    expect(screen.getByText(/15%/)).toBeTruthy();
    expect(screen.getAllByText(/10%/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/更新于/).length).toBeGreaterThan(0);
    expect(screen.getByText(/联盟跳转/)).toBeTruthy();

    const purchaseLink = screen.getByRole("link", { name: "查看京东购买" });
    expect(purchaseLink.textContent).toContain("查看购买");
    expect(purchaseLink.getAttribute("href")).toContain("/offers/2/go?source=BUILDER");
    expect(purchaseLink.getAttribute("target")).toBe("_blank");
    expect(purchaseLink.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("reloads trend data when switching to the 90-day range", async () => {
    render(
      <PriceComparisonDialog onClose={vi.fn()} open selectedComponents={selectedComponents} />,
    );
    await screen.findByLabelText("RTX 5090 价格趋势");

    fireEvent.click(screen.getByRole("button", { name: "90 天" }));

    await waitFor(() => {
      expect(getPriceHistory).toHaveBeenLastCalledWith("gpu-nvidia-rtx5090", "90D");
    });
  });

  it("retries the failed current trend range without erasing the comparison", async () => {
    vi.mocked(getPriceHistory)
      .mockRejectedValueOnce(new Error("history unavailable"))
      .mockResolvedValueOnce(history);

    render(
      <PriceComparisonDialog onClose={vi.fn()} open selectedComponents={selectedComponents} />,
    );

    expect(await screen.findByRole("heading", { name: "NVIDIA GeForce RTX 5090" })).toBeTruthy();
    expect((await screen.findByRole("alert")).textContent).toContain("价格趋势暂不可用");
    fireEvent.click(screen.getByRole("button", { name: "重试价格趋势" }));

    expect(await screen.findByLabelText("RTX 5090 价格趋势")).toBeTruthy();
    expect(getPriceHistory).toHaveBeenNthCalledWith(1, "gpu-nvidia-rtx5090", "30D");
    expect(getPriceHistory).toHaveBeenNthCalledWith(2, "gpu-nvidia-rtx5090", "30D");
    expect(getPriceComparison).toHaveBeenCalledTimes(1);
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
