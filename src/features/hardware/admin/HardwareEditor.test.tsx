// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminHardwareDetail } from "./adminHardware";
import { HardwareEditor } from "./HardwareEditor";

vi.mock("./AdminHardwareApiClient", () => ({
  createAdminHardware: vi.fn(),
  updateAdminHardware: vi.fn(),
  updateAdminPerformance: vi.fn(),
}));

const detail: AdminHardwareDetail = {
  id: 1,
  hardwareKey: "cpu-intel-i9-14900k",
  name: "Intel Core i9-14900K",
  brand: "Intel",
  category: "CPU",
  description: "24 核旗舰桌面处理器",
  price: 3999,
  performance: 96,
  power: 253,
  modelUrl: "/models/cpu/i9.glb",
  modelVariant: "i9",
  coverUrl: "",
  sortOrder: 10,
  status: "ACTIVE",
  version: 1,
  specification: { socket: "LGA1700", cores: 24, threads: 32, tdp: 253 },
  performanceProfile: {
    hardwareId: 1,
    gaming: 94,
    creator: 100,
    ai: 96,
    source: "PC LAB reviewed index V1",
    version: 1,
    measuredAt: "2026-08-01T00:00:00Z",
  },
  models: [],
};

describe("HardwareEditor dirty state", () => {
  afterEach(() => cleanup());

  it("marks an edited record as unsaved before persistence starts", () => {
    render(
      <HardwareEditor
        adminKey="session-secret"
        creating={false}
        detail={detail}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByText("未修改")).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "名称" }), {
      target: { value: "Intel Core i9-14900K LAB" },
    });

    expect(screen.getByText("未保存")).toBeTruthy();
  });
});
