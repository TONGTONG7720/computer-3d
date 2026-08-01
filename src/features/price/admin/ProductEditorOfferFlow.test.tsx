// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminOffer, updateAdminOffer } from "../api/AdminPriceApiClient";
import type { AdminOffer, AdminProduct } from "../domain/adminPrice";
import { ProductEditor } from "./ProductEditor";

vi.mock("../api/AdminPriceApiClient", () => ({
  confirmProductMatch: vi.fn(),
  createAdminOffer: vi.fn(),
  createAdminProduct: vi.fn(),
  deleteAdminProduct: vi.fn(),
  disableAdminOffer: vi.fn(),
  getPriceHistory: vi.fn(),
  previewProductMatch: vi.fn(),
  updateAdminOffer: vi.fn(),
  updateAdminProduct: vi.fn(),
}));

const offer: AdminOffer = {
  id: 17,
  productId: 9,
  platform: "JD",
  seller: "京东自营",
  shopType: "SELF_OPERATED",
  salePrice: 22999,
  couponAmount: 300,
  fullReductionAmount: 0,
  memberDiscountAmount: 0,
  platformSubsidyAmount: 0,
  shippingFee: 0,
  finalPrice: 22699,
  salesCount: 428,
  rating: 4.9,
  sellerScore: 96,
  deliveryScore: 88,
  deliveryNote: "京东物流 · 已人工核验",
  currency: "CNY",
  stockStatus: "IN_STOCK",
  productUrl: "https://item.jd.com/17.html",
  affiliateUrl: "https://u.jd.com/demo",
  recordSource: "MANUAL",
  enabled: true,
  reviewed: true,
  version: 7,
  stale: false,
  checkedAt: "2026-07-31T08:30:00",
};

const product: AdminProduct = {
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
  recordSource: "MANUAL",
  version: 3,
  offers: [offer],
  updatedAt: "2026-07-31T08:30:00",
};

describe("ProductEditor offer flow", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.mocked(createAdminOffer).mockReset();
    vi.mocked(updateAdminOffer).mockReset();
    vi.mocked(createAdminOffer).mockResolvedValue({ ...offer, id: 18, version: 1 });
    vi.mocked(updateAdminOffer).mockResolvedValue({ ...offer, version: 8 });
  });

  it("returns to the product after updating an offer so the stale version cannot be reused", async () => {
    const onChanged = vi.fn();
    render(
      <ProductEditor
        adminKey="session-secret"
        onChanged={onChanged}
        onClose={vi.fn()}
        product={product}
      />,
    );

    fireEvent.click(screen.getByTitle("编辑平台报价"));
    fireEvent.click(screen.getByRole("button", { name: "保存报价" }));

    await waitFor(() => {
      expect(updateAdminOffer).toHaveBeenCalledWith(
        "session-secret",
        17,
        expect.objectContaining({ version: 7 }),
      );
      expect(onChanged).toHaveBeenCalledWith(9);
    });
    expect(screen.queryByRole("button", { name: "保存报价" })).toBeNull();
    expect(screen.getByRole("button", { name: "保存商品" })).toBeTruthy();

    fireEvent.click(screen.getByTitle("编辑平台报价"));
    fireEvent.click(screen.getByRole("button", { name: "保存报价" }));
    await waitFor(() => {
      expect(updateAdminOffer).toHaveBeenLastCalledWith(
        "session-secret",
        17,
        expect.objectContaining({ version: 8 }),
      );
    });
  });

  it("returns to the product after creating an offer so submit cannot duplicate it", async () => {
    const onChanged = vi.fn();
    render(
      <ProductEditor
        adminKey="session-secret"
        onChanged={onChanged}
        onClose={vi.fn()}
        product={{ ...product, offers: [] }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "新增报价" }));
    fireEvent.change(screen.getByLabelText("商家名称"), { target: { value: "显卡旗舰店" } });
    fireEvent.change(screen.getByLabelText("标价"), { target: { value: "21999" } });
    fireEvent.click(screen.getByRole("button", { name: "创建报价" }));

    await waitFor(() => {
      expect(createAdminOffer).toHaveBeenCalledWith(
        "session-secret",
        9,
        expect.objectContaining({ seller: "显卡旗舰店", salePrice: 21999 }),
      );
      expect(onChanged).toHaveBeenCalledWith(9);
    });
    expect(screen.queryByRole("button", { name: "创建报价" })).toBeNull();
    expect(screen.getByRole("button", { name: "保存商品" })).toBeTruthy();

    fireEvent.click(await screen.findByTitle("编辑平台报价"));
    fireEvent.click(screen.getByRole("button", { name: "保存报价" }));
    await waitFor(() => {
      expect(updateAdminOffer).toHaveBeenLastCalledWith(
        "session-secret",
        18,
        expect.objectContaining({ version: 1 }),
      );
    });
  });

  it("submits explicit delivery evidence without synthesizing a shipping promise", async () => {
    render(
      <ProductEditor
        adminKey="session-secret"
        onChanged={vi.fn()}
        onClose={vi.fn()}
        product={{ ...product, offers: [] }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "新增报价" }));
    fireEvent.change(screen.getByLabelText("商家名称"), { target: { value: "显卡旗舰店" } });
    fireEvent.change(screen.getByLabelText("物流可信分"), { target: { value: "92" } });
    fireEvent.change(screen.getByLabelText("人工物流说明"), {
      target: { value: "京东物流 · 次日达" },
    });
    fireEvent.click(screen.getByRole("button", { name: "创建报价" }));

    await waitFor(() => {
      expect(createAdminOffer).toHaveBeenCalledWith(
        "session-secret",
        9,
        expect.objectContaining({
          deliveryScore: 92,
          deliveryNote: "京东物流 · 次日达",
        }),
      );
    });
    expect(screen.queryByText("保证次日达")).toBeNull();
  });
});
