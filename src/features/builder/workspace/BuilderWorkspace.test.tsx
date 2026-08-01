// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
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
});
