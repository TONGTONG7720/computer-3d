// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThreeDViewport } from "./ThreeDViewport";

describe("ThreeDViewport placeholder", () => {
  afterEach(() => cleanup());

  it("switches between four labelled presentation modes without mounting a real model", async () => {
    render(<ThreeDViewport />);

    const buildMode = screen.getByRole("button", { name: "Build 模式" });
    const explodedMode = screen.getByRole("button", { name: "Exploded 模式" });
    expect(buildMode.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(explodedMode);

    expect(explodedMode.getAttribute("aria-pressed")).toBe("true");
    await waitFor(() => {
      expect(screen.getByText("拆解预览")).toBeTruthy();
    });
    expect(screen.getByText("真实模型将在下一阶段接入")).toBeTruthy();
    expect(screen.queryByRole("img", { name: /电脑模型/ })).toBeNull();
  });

  it("preserves the final stage geometry while the viewport module is loading", () => {
    render(<ThreeDViewport loading />);

    expect(screen.getByRole("status").textContent).toContain("正在准备视口");
    expect(screen.getByLabelText("3D 摄像机占位区域")).toBeTruthy();
  });
});
