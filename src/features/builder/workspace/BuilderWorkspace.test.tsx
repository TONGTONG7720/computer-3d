// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchHardwareCatalogue } from "@/features/builder/api/HardwareApiClient";
import { mockHardware } from "@/features/builder/data/mockHardware";
import {
  getBuildQuote,
  getOfferRedirectUrl,
  getPriceComparison,
  getPriceHistory,
} from "@/features/price/api/PriceApiClient";
import {
  comparison,
  deferred,
  history,
} from "@/features/price/builder/PriceComparisonDialog.fixtures";
import type { BuildQuote } from "@/features/price/domain/price";
import { BuilderWorkspace } from "./BuilderWorkspace";

vi.mock("@/features/builder/api/HardwareApiClient", () => ({
  fetchHardwareCatalogue: vi.fn(),
}));

vi.mock("@/features/price/api/PriceApiClient", () => ({
  getBuildQuote: vi.fn(),
  getOfferRedirectUrl: vi.fn((path: string) => `http://127.0.0.1:8088${path}?source=BUILDER`),
  getPriceComparison: vi.fn(),
  getPriceHistory: vi.fn(),
}));

vi.mock("../viewport/ViewportLoader", () => ({
  ViewportLoader: () => <div aria-label="3D 测试视口" role="img" />,
}));

const quoteFixture = (overrides: Partial<BuildQuote> = {}): BuildQuote => ({
  components: [],
  internalTotal: 56_999,
  lowestTotal: 55_599,
  recommendedTotal: 55_899,
  savings: 1_400,
  pricedComponentCount: 8,
  componentCount: 8,
  complete: true,
  disclosure: "V1 为人工维护报价。",
  updatedAt: "2026-08-02T08:30:00",
  ...overrides,
});

describe("BuilderWorkspace shell", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.mocked(fetchHardwareCatalogue).mockReset();
    vi.mocked(fetchHardwareCatalogue).mockResolvedValue(mockHardware);
    vi.mocked(getBuildQuote).mockReset();
    vi.mocked(getBuildQuote).mockResolvedValue(quoteFixture());
    vi.mocked(getPriceComparison).mockReset();
    vi.mocked(getPriceComparison).mockResolvedValue(comparison);
    vi.mocked(getPriceHistory).mockReset();
    vi.mocked(getPriceHistory).mockResolvedValue(history);
    vi.mocked(getOfferRedirectUrl).mockClear();
  });

  it("exposes the toolbar and three stable workspace regions", () => {
    render(<BuilderWorkspace />);

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("main", { name: "电脑配置工作台" })).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "硬件组件库" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "3D 预览工作区" })).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "配置分析面板" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "跳到配置工作区" })).toBeTruthy();
  });

  it("opens only one responsive workspace sheet at a time", async () => {
    render(<BuilderWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "打开组件库" }));
    expect(await screen.findByRole("dialog", { name: "选择组件" })).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: "配置分析" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "关闭选择组件" }));
    await waitFor(
      () => {
        expect(screen.queryByRole("dialog", { name: "选择组件" })).toBeNull();
      },
      { timeout: 5_000 },
    );

    fireEvent.click(screen.getByRole("button", { name: "打开配置分析" }));
    await waitFor(
      () => {
        expect(screen.getByRole("dialog", { name: "配置分析" })).toBeTruthy();
        expect(screen.queryByRole("dialog", { name: "选择组件" })).toBeNull();
      },
      { timeout: 5_000 },
    );
  });

  it("opens the lazy price intelligence dialog from the shared build summary", async () => {
    render(<BuilderWorkspace />);

    expect(await screen.findByText("最低购买")).toBeTruthy();
    expect(screen.getByText("可节省 ¥1,400")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "查看购买方案" }));

    expect(await screen.findByRole("dialog", { name: /价格智能/ })).toBeTruthy();
  });

  it("does not let an older build quote overwrite a newer hardware selection", async () => {
    const oldRequest = deferred<BuildQuote>();
    const newRequest = deferred<BuildQuote>();
    vi.mocked(getBuildQuote).mockImplementation((hardwareKeys) =>
      hardwareKeys.includes("gpu-nvidia-rtx5080") ? newRequest.promise : oldRequest.promise,
    );
    render(<BuilderWorkspace />);

    await waitFor(() => expect(getBuildQuote).toHaveBeenCalledOnce());
    const gpuCategory = screen.getAllByRole("button", { name: /显卡/ })[0];
    if (gpuCategory === undefined) {
      throw new Error("Builder fixture requires the GPU category control");
    }
    fireEvent.click(gpuCategory);
    const gpuOptions = await screen.findByRole("list", { name: "GPU 可选硬件" });
    fireEvent.click(within(gpuOptions).getByRole("button", { name: /NVIDIA GeForce RTX 5080/ }));

    await waitFor(() =>
      expect(getBuildQuote).toHaveBeenLastCalledWith(
        expect.arrayContaining(["gpu-nvidia-rtx5080"]),
      ),
    );
    await act(async () => {
      newRequest.resolve(quoteFixture({ lowestTotal: 54_999, savings: 2_000 }));
      await newRequest.promise;
    });
    expect(await screen.findByText("可节省 ¥2,000")).toBeTruthy();

    await act(async () => {
      oldRequest.resolve(quoteFixture({ lowestTotal: 47_999, savings: 9_000 }));
      await oldRequest.promise;
    });
    expect(screen.getByText("可节省 ¥2,000")).toBeTruthy();
    expect(screen.queryByText("可节省 ¥9,000")).toBeNull();
  });
});
