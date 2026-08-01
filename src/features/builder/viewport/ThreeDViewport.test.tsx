// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BuilderStoreProvider } from "@/features/builder/store/BuilderStoreProvider";

vi.mock("@/three/viewer/BuilderPCViewer", () => ({
  BuilderPCViewer: ({
    cameraView,
    mode,
    onStatus,
  }: {
    readonly cameraView: string;
    readonly mode: string;
    readonly onStatus: (status: { readonly kind: "ready"; readonly label: string }) => void;
  }) => {
    useEffect(() => {
      onStatus({ kind: "ready", label: "desktop-high · modular PC scene" });
    }, [onStatus]);
    return (
      <div
        aria-label="PC LAB interactive 3D computer viewer"
        data-camera={cameraView}
        data-mode={mode}
        role="application"
      />
    );
  },
}));

import { ThreeDViewport } from "./ThreeDViewport";

const renderViewport = () =>
  render(
    <BuilderStoreProvider>
      <ThreeDViewport />
    </BuilderStoreProvider>,
  );

describe("ThreeDViewport", () => {
  afterEach(() => cleanup());

  it("mounts the real modular viewer and switches presentation modes", () => {
    renderViewport();

    const viewer = screen.getByRole("application", {
      name: "PC LAB interactive 3D computer viewer",
    });
    const explodedMode = screen.getByRole("button", { name: "Exploded 模式" });

    expect(viewer.getAttribute("data-mode")).toBe("build");
    fireEvent.click(explodedMode);

    expect(explodedMode.getAttribute("aria-pressed")).toBe("true");
    expect(viewer.getAttribute("data-mode")).toBe("exploded");
    expect(screen.queryByText("真实模型将在下一阶段接入")).toBeNull();
  });

  it("provides working detail/reset controls and the RGB studio controls", () => {
    renderViewport();

    const viewer = screen.getByRole("application");
    fireEvent.click(screen.getByRole("button", { name: "内部聚焦" }));
    expect(viewer.getAttribute("data-camera")).toBe("detail");

    fireEvent.click(screen.getByRole("button", { name: "重置镜头" }));
    expect(viewer.getAttribute("data-camera")).toBe("default");

    fireEvent.click(screen.getByRole("button", { name: "Studio 模式" }));
    expect(screen.getByLabelText("RGB 颜色")).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "RGB 灯效" })).toBeTruthy();
  });

  it("reports the live scene status and preserves the loading shell", () => {
    renderViewport();
    expect(screen.getByRole("status").textContent).toContain("modular PC scene");

    cleanup();
    render(
      <BuilderStoreProvider>
        <ThreeDViewport loading />
      </BuilderStoreProvider>,
    );
    expect(screen.getByRole("status").textContent).toContain("正在准备 3D 引擎");
  });
});
