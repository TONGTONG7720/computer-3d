// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  confirmProductMatch,
  previewProductMatch,
  updateAdminProduct,
} from "../api/AdminPriceApiClient";
import type { AdminProduct, MatchPreview } from "../domain/adminPrice";
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
  matchConfidence: 0.82,
  matchStatus: "REVIEW_REQUIRED",
  status: "DRAFT",
  recordSource: "MANUAL",
  version: 3,
  offers: [],
  updatedAt: "2026-07-31T08:30:00",
};

const preview: MatchPreview = {
  hardwareId: 2,
  hardwareKey: "gpu-nvidia-rtx5090",
  hardwareName: "NVIDIA GeForce RTX 5090",
  confidence: 0.98,
  decision: "CONFIRMED",
  dimensionScores: { model: 1 },
  explanations: ["品牌与型号一致"],
};

describe("ProductEditor", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(previewProductMatch).mockReset();
    vi.mocked(confirmProductMatch).mockReset();
    vi.mocked(updateAdminProduct).mockReset();
    vi.mocked(previewProductMatch).mockResolvedValue(preview);
    vi.mocked(confirmProductMatch).mockResolvedValue({
      ...product,
      matchConfidence: 0.98,
      matchStatus: "CONFIRMED",
      status: "ACTIVE",
      version: 4,
    });
    vi.mocked(updateAdminProduct).mockResolvedValue({ ...product, version: 5 });
  });

  it("confirms a reviewed hardware match before offers are maintained", async () => {
    const onChanged = vi.fn();
    render(
      <ProductEditor
        adminKey="session-secret"
        onChanged={onChanged}
        onClose={vi.fn()}
        product={product}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "预览匹配" }));
    expect(await screen.findByText("品牌与型号一致")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "确认匹配" }));

    await waitFor(() => {
      expect(confirmProductMatch).toHaveBeenCalledWith("session-secret", 9, 2, 3);
    });
    expect(onChanged).toHaveBeenCalledWith(9);
  });

  it("locks every write action for an internal reference product", () => {
    render(
      <ProductEditor
        adminKey="session-secret"
        onChanged={vi.fn()}
        onClose={vi.fn()}
        product={{ ...product, recordSource: "INTERNAL", matchStatus: "CONFIRMED" }}
      />,
    );

    const titleInput = screen.getByLabelText("商品标题");
    expect(titleInput instanceof HTMLInputElement && titleInput.disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "停用商品" })).toBeNull();
    expect(screen.queryByRole("button", { name: "新增报价" })).toBeNull();
    expect(screen.getByText("内部参考资料由硬件目录维护，此处只读。")).toBeTruthy();
  });

  it("invalidates a match preview when matching input changes", async () => {
    render(
      <ProductEditor
        adminKey="session-secret"
        onChanged={vi.fn()}
        onClose={vi.fn()}
        product={product}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "预览匹配" }));
    expect(await screen.findByText("品牌与型号一致")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("商品标题"), {
      target: { value: "华硕 RTX 5080 OC 16G" },
    });

    expect(screen.queryByText("品牌与型号一致")).toBeNull();
    expect(screen.queryByRole("button", { name: "确认匹配" })).toBeNull();
  });

  it("does not confirm a rejected match preview", async () => {
    vi.mocked(previewProductMatch).mockResolvedValue({
      ...preview,
      confidence: 0.2,
      decision: "REJECTED",
      explanations: ["型号不一致"],
    });
    render(
      <ProductEditor
        adminKey="session-secret"
        onChanged={vi.fn()}
        onClose={vi.fn()}
        product={product}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "预览匹配" }));
    expect(await screen.findByText("型号不一致")).toBeTruthy();
    const confirmButton = screen.getByRole("button", { name: "无法确认" });
    expect(confirmButton instanceof HTMLButtonElement && confirmButton.disabled).toBe(true);
    fireEvent.click(confirmButton);

    expect(confirmProductMatch).not.toHaveBeenCalled();
  });

  it("uses the confirmed version for a following product save", async () => {
    render(
      <ProductEditor
        adminKey="session-secret"
        onChanged={vi.fn()}
        onClose={vi.fn()}
        product={product}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "预览匹配" }));
    expect(await screen.findByText("品牌与型号一致")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "确认匹配" }));
    await waitFor(() => expect(confirmProductMatch).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "保存商品" }));

    await waitFor(() => {
      expect(updateAdminProduct).toHaveBeenCalledWith(
        "session-secret",
        9,
        expect.objectContaining({ version: 4 }),
      );
    });
  });
});
