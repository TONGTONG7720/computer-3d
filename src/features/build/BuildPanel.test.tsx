// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { hardwareByCategory, mockHardware } from "@/features/builder/data/mockHardware";
import { BuilderStoreProvider } from "@/features/builder/store/BuilderStoreProvider";
import { createBuilderStore } from "@/store/builderStore";
import { BuildPanel } from "./BuildPanel";

describe("BuildPanel", () => {
  afterEach(() => cleanup());

  it("shows all selected parts and keeps price, power, performance, and compatibility synchronized", async () => {
    const store = createBuilderStore({ initialCatalogue: mockHardware });
    const initialPrice = store.getState().totalPrice;
    render(
      <BuilderStoreProvider store={store}>
        <BuildPanel />
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
        <BuildPanel />
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
});
