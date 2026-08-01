// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hardwareByCategory, mockHardware } from "@/features/builder/data/mockHardware";
import { BuilderStoreProvider } from "@/features/builder/store/BuilderStoreProvider";
import { formatPriceMoney } from "@/features/price/builder/priceFormat";
import { createBuilderStore } from "@/store/builderStore";
import { BuildPanel } from "./BuildPanel";

describe("BuildPanel", () => {
  afterEach(() => cleanup());

  it("shows all selected parts and keeps price, power, performance, and compatibility synchronized", async () => {
    const store = createBuilderStore({ initialCatalogue: mockHardware });
    const initialPrice = store.getState().totalPrice;
    render(
      <BuilderStoreProvider store={store}>
        <BuildPanel
          onOpenPrices={vi.fn()}
          quoteState={{ quote: null, retry: vi.fn(), status: "idle" }}
        />
      </BuilderStoreProvider>,
    );

    const configuration = screen.getByRole("list", { name: "当前配置" });
    expect(within(configuration).getAllByRole("listitem")).toHaveLength(8);
    expect(screen.getByText("游戏性能")).toBeTruthy();
    expect(screen.getByText("渲染性能")).toBeTruthy();
    expect(screen.getByText("AI 性能")).toBeTruthy();
    expect(screen.getByText(/7 条规则已检查/)).toBeTruthy();

    const amdCpu = hardwareByCategory.cpu[1];
    if (amdCpu !== undefined) {
      act(() => store.getState().selectHardware(amdCpu));
    }

    await waitFor(() => {
      expect(screen.getByRole("status", { name: "兼容状态" }).textContent).toContain("冲突");
    });
    expect(screen.getByText(/不能安装在/)).toBeTruthy();
    expect(store.getState().totalPrice).not.toBe(initialPrice);
    expect(screen.getByText(`${store.getState().powerUsage}W`)).toBeTruthy();
  });

  it("surfaces a PSU consideration instead of reducing compatibility to a color", async () => {
    const store = createBuilderStore({ initialCatalogue: mockHardware });
    render(
      <BuilderStoreProvider store={store}>
        <BuildPanel
          onOpenPrices={vi.fn()}
          quoteState={{ quote: null, retry: vi.fn(), status: "idle" }}
        />
      </BuilderStoreProvider>,
    );
    const psu1000 = hardwareByCategory.power_supply[1];
    if (psu1000 !== undefined) {
      act(() => store.getState().selectHardware(psu1000));
    }

    await waitFor(() => {
      expect(screen.getByRole("status", { name: "兼容状态" }).textContent).toContain("需注意");
    });
    expect(screen.getByText(/建议至少/)).toBeTruthy();
  });

  it("shows the typed purchase summary and opens the purchase plans", () => {
    const store = createBuilderStore({ initialCatalogue: mockHardware });
    const localTotal = store.getState().totalPrice;
    const onOpenPrices = vi.fn();

    render(
      <BuilderStoreProvider store={store}>
        <BuildPanel
          onOpenPrices={onOpenPrices}
          quoteState={{
            quote: {
              components: [],
              internalTotal: localTotal + 10_000,
              lowestTotal: 55_599,
              recommendedTotal: 55_899,
              savings: 1_400,
              pricedComponentCount: 8,
              componentCount: 8,
              complete: true,
              disclosure: "V1 为人工维护报价。",
              updatedAt: "2026-08-02T08:30:00",
            },
            retry: vi.fn(),
            status: "success",
          }}
        />
      </BuilderStoreProvider>,
    );

    const summary = screen.getByRole("region", { name: "整机价格情报" });
    expect(within(summary).getByText("内部参考")).toBeTruthy();
    expect(within(summary).getByText(formatPriceMoney(localTotal))).toBeTruthy();
    expect(within(summary).queryByText(formatPriceMoney(localTotal + 10_000))).toBeNull();
    expect(within(summary).getByText("最低购买")).toBeTruthy();
    expect(within(summary).getByText("可节省 ¥1,400")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "查看购买方案" }));
    expect(onOpenPrices).toHaveBeenCalledOnce();
  });

  it("keeps the local internal total when platform quotes fail", () => {
    const store = createBuilderStore({ initialCatalogue: mockHardware });
    const localTotal = store.getState().totalPrice;
    const onOpenPrices = vi.fn();
    const retry = vi.fn();

    render(
      <BuilderStoreProvider store={store}>
        <BuildPanel
          onOpenPrices={onOpenPrices}
          quoteState={{ quote: null, retry, status: "error" }}
        />
      </BuilderStoreProvider>,
    );

    const summary = screen.getByRole("region", { name: "整机价格情报" });
    expect(within(summary).getByText("平台报价暂不可用")).toBeTruthy();
    expect(within(summary).getByText(formatPriceMoney(localTotal))).toBeTruthy();

    fireEvent.click(within(summary).getByRole("button", { name: "重新获取平台报价" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(onOpenPrices).not.toHaveBeenCalled();
  });
});
