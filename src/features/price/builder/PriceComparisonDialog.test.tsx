// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptySelectedComponents, parseHardwareId } from "@/features/builder/domain/hardware";
import { builderStore } from "@/store/builderStore";
import { getOfferRedirectUrl, getPriceComparison, getPriceHistory } from "../api/PriceApiClient";
import type { PriceComparison, PriceHistory } from "../domain/price";
import { PriceComparisonDialog } from "./PriceComparisonDialog";

vi.mock("../api/PriceApiClient", () => ({
  getOfferRedirectUrl: vi.fn((path: string) => `http://127.0.0.1:8088${path}?source=BUILDER`),
  getPriceComparison: vi.fn(),
  getPriceHistory: vi.fn(),
}));

const gpu = {
  id: parseHardwareId("gpu-nvidia-rtx5090"),
  name: "NVIDIA GeForce RTX 5090",
  brand: "NVIDIA",
  category: "gpu",
  price: 23999,
  performance: 100,
  power: 575,
  modelUrl: "/models/rtx5090.glb",
  modelVariant: "rtx5090",
  vram: 32,
  length: 336,
} as const;

const nextGpu = {
  ...gpu,
  id: parseHardwareId("gpu-nvidia-rtx5080"),
  name: "NVIDIA GeForce RTX 5080",
};

const comparison: PriceComparison = {
  hardwareKey: "gpu-nvidia-rtx5090",
  hardwareName: "NVIDIA GeForce RTX 5090",
  internalReferencePrice: 23999,
  lowestPrice: 21999,
  lowestOfferId: 1,
  recommendedOfferId: 2,
  recommendedReason: "京东自营综合可信度更高",
  priceRange: { min: 21999, max: 22699 },
  offers: [
    {
      id: 1,
      platform: "PDD",
      platformLabel: "拼多多",
      seller: "显卡严选店",
      shopType: "MARKETPLACE",
      salePrice: 21999,
      discount: 0,
      shipping: 0,
      finalPrice: 21999,
      rating: 4.6,
      salesCount: 86,
      trustScore: 78,
      rankingScore: 84,
      matchConfidence: 0.96,
      stale: true,
      tags: ["最低价"],
      redirectPath: "/api/price-intelligence/offers/1/go",
      recordSource: "MANUAL_DEMO",
    },
    {
      id: 2,
      platform: "JD",
      platformLabel: "京东",
      seller: "京东自营",
      shopType: "SELF_OPERATED",
      salePrice: 22999,
      discount: 300,
      shipping: 0,
      finalPrice: 22699,
      rating: 4.9,
      salesCount: 428,
      trustScore: 96,
      rankingScore: 92,
      matchConfidence: 0.98,
      stale: false,
      tags: ["自营"],
      redirectPath: "/api/price-intelligence/offers/2/go",
      recordSource: "MANUAL_DEMO",
    },
  ],
  dataMode: "MANUAL",
  disclosure: "平台报价由人工维护，不代表实时成交价。",
  updatedAt: "2026-07-31T08:30:00",
};

const history: PriceHistory = {
  hardwareKey: "gpu-nvidia-rtx5090",
  range: "30D",
  platform: null,
  points: [
    { date: "2026-07-30", minimumPrice: 22499, offerCount: 3 },
    { date: "2026-07-31", minimumPrice: 21999, offerCount: 3 },
  ],
  lowestPrice: 21999,
  highestPrice: 22499,
  changePercent: -2.22,
  updatedAt: "2026-07-31T08:30:00",
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
    builderStore.setState({
      activeCategory: "gpu",
      selectedComponents: {
        ...emptySelectedComponents(),
        gpu,
      },
    });
  });

  it("distinguishes the lowest offer from the reliable recommendation", async () => {
    render(<PriceComparisonDialog onClose={vi.fn()} open />);

    expect(await screen.findByText("NVIDIA GeForce RTX 5090")).toBeTruthy();
    expect(screen.getByText("最低价")).toBeTruthy();
    expect(screen.getByText("可靠推荐")).toBeTruthy();
    expect(screen.getByText("数据可能过期")).toBeTruthy();

    const purchaseLink = screen.getByRole("link", { name: "前往京东购买" });
    expect(purchaseLink.getAttribute("href")).toContain("/offers/2/go?source=BUILDER");
    expect(purchaseLink.getAttribute("target")).toBe("_blank");
    expect(purchaseLink.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("reloads trend data when switching between 30 and 7 days", async () => {
    render(<PriceComparisonDialog onClose={vi.fn()} open />);
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

    render(<PriceComparisonDialog onClose={vi.fn()} open />);

    expect(await screen.findByText("暂无可购买报价")).toBeTruthy();
    expect(screen.getByText("仍可使用内部参考价完成配置。")).toBeTruthy();
  });

  it("refetches when the selected hardware changes", async () => {
    render(<PriceComparisonDialog onClose={vi.fn()} open />);
    await screen.findByText("NVIDIA GeForce RTX 5090");

    builderStore.setState({
      selectedComponents: {
        ...emptySelectedComponents(),
        gpu: nextGpu,
      },
    });

    await waitFor(() => {
      expect(getPriceComparison).toHaveBeenLastCalledWith("gpu-nvidia-rtx5080");
    });
  });
});
