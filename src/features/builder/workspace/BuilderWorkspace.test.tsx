// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BuilderWorkspace } from "./BuilderWorkspace";

describe("BuilderWorkspace shell", () => {
  afterEach(() => cleanup());

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
});
