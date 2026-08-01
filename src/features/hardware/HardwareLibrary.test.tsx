// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { mockHardware } from "@/features/builder/data/mockHardware";
import { BuilderStoreProvider } from "@/features/builder/store/BuilderStoreProvider";
import { createBuilderStore } from "@/store/builderStore";
import { HardwareLibrary } from "./HardwareLibrary";

describe("HardwareLibrary", () => {
  afterEach(() => cleanup());

  it("searches the active category and installs a selected option through Zustand", () => {
    const store = createBuilderStore({ initialCatalogue: mockHardware });
    render(
      <BuilderStoreProvider store={store}>
        <HardwareLibrary />
      </BuilderStoreProvider>,
    );

    expect(screen.getByText("8 / 8 已安装")).toBeTruthy();
    const search = screen.getByRole("searchbox", { name: "搜索 CPU" });
    fireEvent.change(search, { target: { value: "Ryzen" } });

    const options = screen.getByRole("list", { name: "CPU 可选硬件" });
    expect(within(options).getByText("AMD Ryzen 7 7800X3D")).toBeTruthy();
    expect(within(options).queryByText("Intel Core i9-14900K")).toBeNull();

    fireEvent.click(within(options).getByRole("button", { name: /AMD Ryzen 7 7800X3D/ }));
    expect(store.getState().selectedComponents.cpu?.brand).toBe("AMD");
    expect(store.getState().compatibilityStatus.status).toBe("error");
    expect(screen.getByText("存在冲突", { selector: "span" })).toBeTruthy();
  });

  it("switches categories and presents an actionable empty search state", () => {
    const store = createBuilderStore({ initialCatalogue: mockHardware });
    render(
      <BuilderStoreProvider store={store}>
        <HardwareLibrary />
      </BuilderStoreProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /显卡/ }));
    expect(screen.getByRole("searchbox", { name: "搜索 GPU" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "GPU 可选硬件" })).toBeTruthy();

    fireEvent.change(screen.getByRole("searchbox", { name: "搜索 GPU" }), {
      target: { value: "不存在的型号" },
    });
    expect(screen.getByText("没有匹配的 GPU")).toBeTruthy();
    expect(screen.getByRole("button", { name: "清除搜索" })).toBeTruthy();
  });

  it("shows a precise backend recovery action and retries the catalogue", async () => {
    let attempt = 0;
    const store = createBuilderStore({
      catalogueLoader: async () => {
        attempt += 1;
        if (attempt === 1) {
          throw new Error("offline");
        }
        return mockHardware;
      },
    });
    await store.getState().initializeCatalogue();

    render(
      <BuilderStoreProvider store={store}>
        <HardwareLibrary />
      </BuilderStoreProvider>,
    );

    expect(screen.getByText("硬件目录加载失败")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "重新连接" }));
    await waitFor(() => {
      expect(screen.getByText("8 / 8 已安装")).toBeTruthy();
    });
  });
});
