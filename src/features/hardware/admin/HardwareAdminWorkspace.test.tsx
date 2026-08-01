// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchAdminHardware,
  fetchAdminHardwareDetail,
  fetchCompatibilityRules,
} from "./AdminHardwareApiClient";
import { HardwareAdminWorkspace } from "./HardwareAdminWorkspace";

vi.mock("./AdminHardwareApiClient", () => ({
  createAdminHardware: vi.fn(),
  createCompatibilityRule: vi.fn(),
  fetchAdminHardware: vi.fn(),
  fetchAdminHardwareDetail: vi.fn(),
  fetchCompatibilityRules: vi.fn(),
  updateAdminHardware: vi.fn(),
  updateAdminModel: vi.fn(),
  updateAdminPerformance: vi.fn(),
  updateCompatibilityRule: vi.fn(),
  uploadAdminModel: vi.fn(),
}));

describe("HardwareAdminWorkspace", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.mocked(fetchAdminHardware).mockResolvedValue([]);
    vi.mocked(fetchCompatibilityRules).mockResolvedValue([]);
    vi.mocked(fetchAdminHardwareDetail).mockRejectedValue(new Error("unused"));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("keeps the Admin Key in session storage and supports keyboard workspace tabs", async () => {
    render(<HardwareAdminWorkspace />);

    fireEvent.change(screen.getByLabelText("Admin Key"), {
      target: { value: "session-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "进入控制台" }));

    expect(await screen.findByText("HARDWARE OPERATIONS")).toBeTruthy();
    expect(window.sessionStorage.getItem("pc-lab-hardware-admin-key")).toBe("session-secret");
    await waitFor(() => expect(fetchAdminHardware).toHaveBeenCalled());

    const tabs = screen.getByRole("tablist", { name: "硬件后台工作区" });
    const hardwareTab = screen.getByRole("tab", { name: "硬件档案" });
    const modelTab = screen.getByRole("tab", { name: "模型管理" });
    hardwareTab.focus();
    fireEvent.keyDown(tabs, { key: "ArrowRight" });
    expect(modelTab.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(modelTab);
  });
});
