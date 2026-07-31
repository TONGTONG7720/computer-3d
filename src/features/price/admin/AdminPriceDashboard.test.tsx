// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAdminDashboard, fetchAdminProducts } from "../api/AdminPriceApiClient";
import type { AdminDashboard, AdminProductPage } from "../domain/adminPrice";
import { AdminPriceDashboard } from "./AdminPriceDashboard";

vi.mock("../api/AdminPriceApiClient", () => ({
  confirmProductMatch: vi.fn(),
  createAdminOffer: vi.fn(),
  createAdminProduct: vi.fn(),
  deleteAdminProduct: vi.fn(),
  disableAdminOffer: vi.fn(),
  fetchAdminDashboard: vi.fn(),
  fetchAdminProducts: vi.fn(),
  previewProductMatch: vi.fn(),
  updateAdminOffer: vi.fn(),
  updateAdminProduct: vi.fn(),
}));

const dashboard: AdminDashboard = {
  activeProducts: 3,
  validOffers: 7,
  staleOffers: 1,
  missingCoverage: 2,
  clicksLast24Hours: 14,
  topClickedHardware: [],
  dataMode: "MANUAL",
  generatedAt: "2026-07-31T08:30:00",
};

const productPage: AdminProductPage = {
  page: 1,
  size: 20,
  total: 1,
  totalPages: 1,
  items: [
    {
      id: 9,
      productKey: "manual-jd-rtx5090",
      hardwareId: 2,
      title: "华硕 RTX 5090 OC 32G",
      brand: "ASUS",
      model: "RTX 5090 OC",
      category: "GPU",
      imageUrl: "",
      description: "人工维护演示报价",
      matchConfidence: 0.98,
      matchStatus: "CONFIRMED",
      status: "ACTIVE",
      recordSource: "MANUAL_DEMO",
      version: 1,
      offers: [
        {
          id: 41,
          productId: 9,
          platform: "JD",
          seller: "京东自营",
          shopType: "SELF_OPERATED",
          salePrice: 22999,
          couponAmount: 700,
          fullReductionAmount: 0,
          memberDiscountAmount: 0,
          platformSubsidyAmount: 0,
          shippingFee: 0,
          finalPrice: 22299,
          salesCount: 428,
          rating: 4.9,
          sellerScore: 96,
          currency: "CNY",
          stockStatus: "IN_STOCK",
          productUrl: "https://item.jd.com/41.html",
          affiliateUrl: "",
          recordSource: "MANUAL_DEMO",
          enabled: true,
          reviewed: true,
          version: 1,
          stale: true,
          checkedAt: "2026-07-31T08:30:00",
        },
      ],
      updatedAt: "2026-07-31T08:30:00",
    },
  ],
};

describe("AdminPriceDashboard", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(fetchAdminDashboard).mockReset();
    vi.mocked(fetchAdminProducts).mockReset();
  });

  it("keeps the Admin Key in session storage and loads the manual catalog", async () => {
    vi.mocked(fetchAdminDashboard).mockResolvedValue(dashboard);
    vi.mocked(fetchAdminProducts).mockResolvedValue(productPage);

    render(<AdminPriceDashboard />);

    expect(screen.getByRole("heading", { name: "价格情报控制台" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Admin Key"), {
      target: { value: "session-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "进入控制台" }));

    expect(await screen.findByText("华硕 RTX 5090 OC 32G")).toBeTruthy();
    expect(screen.getAllByText("过期报价")).toHaveLength(2);
    expect(screen.getByText("人工数据")).toBeTruthy();
    expect(screen.getByText("硬件 #2")).toBeTruthy();
    expect(screen.getByTestId("admin-overview-safe-area").textContent).toContain("价格情报控制台");
    expect(sessionStorage.getItem("pc-lab-price-admin-key")).toBe("session-secret");
  });

  it("shows a recoverable error when the Admin API cannot be reached", async () => {
    vi.mocked(fetchAdminDashboard).mockRejectedValue(new Error("offline"));
    vi.mocked(fetchAdminProducts).mockRejectedValue(new Error("offline"));

    render(<AdminPriceDashboard />);
    fireEvent.change(screen.getByLabelText("Admin Key"), {
      target: { value: "session-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "进入控制台" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("无法加载价格数据");
    });
    expect(screen.getByRole("button", { name: "重新加载" })).toBeTruthy();
  });

  it("navigates every product page without dropping active filters", async () => {
    const firstPage = { ...productPage, total: 28, totalPages: 2 };
    const secondPage = { ...productPage, page: 2, total: 28, totalPages: 2, items: [] };
    vi.mocked(fetchAdminDashboard).mockResolvedValue(dashboard);
    vi.mocked(fetchAdminProducts)
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    render(<AdminPriceDashboard />);
    fireEvent.change(screen.getByLabelText("Admin Key"), {
      target: { value: "session-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "进入控制台" }));
    await screen.findByText("华硕 RTX 5090 OC 32G");

    fireEvent.click(screen.getByRole("button", { name: "下一页" }));

    await waitFor(() => {
      expect(fetchAdminProducts).toHaveBeenLastCalledWith(
        "session-secret",
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  it("offers a mobile filter sheet with category and match status", async () => {
    vi.mocked(fetchAdminDashboard).mockResolvedValue(dashboard);
    vi.mocked(fetchAdminProducts).mockResolvedValue(productPage);

    render(<AdminPriceDashboard />);
    fireEvent.change(screen.getByLabelText("Admin Key"), {
      target: { value: "session-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "进入控制台" }));
    await screen.findByText("华硕 RTX 5090 OC 32G");

    fireEvent.click(screen.getByRole("button", { name: "筛选商品" }));
    const sheet = screen.getByRole("dialog", { name: "商品筛选" });
    fireEvent.change(within(sheet).getByLabelText("筛选分类"), { target: { value: "GPU" } });
    fireEvent.change(within(sheet).getByLabelText("筛选匹配状态"), {
      target: { value: "CONFIRMED" },
    });
    fireEvent.click(within(sheet).getByRole("button", { name: "应用筛选" }));

    await waitFor(() => {
      expect(fetchAdminProducts).toHaveBeenLastCalledWith(
        "session-secret",
        expect.objectContaining({ category: "GPU", matchStatus: "CONFIRMED", page: 1 }),
      );
    });
  });
});
