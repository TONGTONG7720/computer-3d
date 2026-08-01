// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BuilderToolbar } from "./BuilderToolbar";

const toolbarProps = {
  buildName: "我的游戏主机",
  budget: 30000,
  compatibility: "success" as const,
  performance: 96,
  saveState: "dirty" as const,
  onBuildNameChange: vi.fn(),
  onOpenComponents: vi.fn(),
  onOpenSummary: vi.fn(),
  onSave: vi.fn(),
};

describe("BuilderToolbar", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("commits an inline build name with Enter and cancels with Escape", () => {
    const onBuildNameChange = vi.fn();
    render(<BuilderToolbar {...toolbarProps} onBuildNameChange={onBuildNameChange} />);

    fireEvent.click(screen.getByRole("button", { name: "重命名配置" }));
    const input = screen.getByRole("textbox", { name: "配置名称" });
    fireEvent.change(input, { target: { value: "白色创作工作站" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onBuildNameChange).toHaveBeenCalledWith("白色创作工作站");

    fireEvent.click(screen.getByRole("button", { name: "重命名配置" }));
    const cancelInput = screen.getByRole("textbox", { name: "配置名称" });
    fireEvent.change(cancelInput, { target: { value: "不要保存这个名字" } });
    fireEvent.keyDown(cancelInput, { key: "Escape" });
    expect(onBuildNameChange).toHaveBeenCalledTimes(1);
  });

  it("shows health values, saving feedback, and an explicit deferred Share reason", () => {
    render(<BuilderToolbar {...toolbarProps} saveState="saving" />);

    expect(screen.getByText("预算 ¥30,000")).toBeTruthy();
    expect(screen.getByText("性能 96")).toBeTruthy();
    expect(screen.getByText("兼容")).toBeTruthy();
    expect(screen.getByText("正在保存")).toBeTruthy();

    const share = screen.getByRole("button", { name: "分享配置" });
    expect(share.hasAttribute("disabled")).toBe(true);
    expect(share.getAttribute("title")).toContain("后续阶段");
  });
});
