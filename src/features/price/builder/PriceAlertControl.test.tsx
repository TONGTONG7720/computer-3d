// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deletePriceAlert,
  getPriceAlerts,
  parsePriceAlertOwner,
  upsertPriceAlert,
} from "../api/PriceApiClient";
import type { PriceAlert } from "../domain/price";
import { PriceAlertControl } from "./PriceAlertControl";
import { deferred } from "./PriceComparisonDialog.fixtures";
import { getOrCreatePriceAlertOwner } from "./priceAlertOwner";

vi.mock("../api/PriceApiClient", async (importOriginal) => {
  const original = await importOriginal<typeof import("../api/PriceApiClient")>();
  return {
    ...original,
    deletePriceAlert: vi.fn(),
    getPriceAlerts: vi.fn(),
    upsertPriceAlert: vi.fn(),
  };
});

const ownerValue = "7f34d22c-7be0-49e0-bf66-fdf116188756";
const owner = parsePriceAlertOwner(ownerValue);

const activeAlert: PriceAlert = {
  publicId: "69dce68f-c544-456d-a700-65d9823bde2c",
  hardwareKey: "gpu-nvidia-rtx5090",
  hardwareName: "NVIDIA GeForce RTX 5090",
  targetPrice: 19_999,
  currentBestPrice: 21_999,
  status: "ACTIVE",
  triggeredAt: null,
  checkedAt: "2026-08-02T08:30:00",
  updatedAt: "2026-08-02T08:30:00",
};

describe("priceAlertOwner", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("returns one stable browser UUID without exposing it in markup", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => ownerValue) });

    const first = getOrCreatePriceAlertOwner();
    const second = getOrCreatePriceAlertOwner();

    expect(first).toBe(owner);
    expect(second).toBe(owner);
    expect(window.localStorage.getItem("pc-lab-price-alert-owner-v1")).toBe(owner);
    expect(document.body.textContent).not.toContain(ownerValue);
  });

  it("fails safely when browser storage or UUID generation is unavailable", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("storage unavailable");
    });
    expect(getOrCreatePriceAlertOwner()).toBeNull();
    getItem.mockRestore();

    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => {
        throw new DOMException("crypto unavailable");
      }),
    });
    expect(getOrCreatePriceAlertOwner()).toBeNull();
  });
});

describe("PriceAlertControl", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("pc-lab-price-alert-owner-v1", ownerValue);
    vi.mocked(getPriceAlerts).mockReset();
    vi.mocked(upsertPriceAlert).mockReset();
    vi.mocked(deletePriceAlert).mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders a labelled mobile-safe control while no alert exists", async () => {
    vi.mocked(getPriceAlerts).mockResolvedValue([]);

    const { container } = render(
      <PriceAlertControl hardwareKey="gpu-nvidia-rtx5090" hardwareName="RTX 5090" />,
    );

    const input = await screen.findByRole("spinbutton", { name: "目标到手价" });
    expect(input.getAttribute("inputmode")).toBe("decimal");
    expect(screen.getByRole("button", { name: "设置提醒" })).toBeTruthy();
    expect(container.querySelector("[data-control-size='touch']")).toBeTruthy();
  });

  it("creates an alert and renders the active state", async () => {
    vi.mocked(getPriceAlerts).mockResolvedValue([]);
    vi.mocked(upsertPriceAlert).mockResolvedValue(activeAlert);
    render(<PriceAlertControl hardwareKey={activeAlert.hardwareKey} hardwareName="RTX 5090" />);
    const input = await screen.findByRole("spinbutton", { name: "目标到手价" });

    fireEvent.change(input, { target: { value: "19999" } });
    fireEvent.click(screen.getByRole("button", { name: "设置提醒" }));

    await waitFor(() => {
      expect(upsertPriceAlert).toHaveBeenCalledWith(activeAlert.hardwareKey, 19_999, owner);
    });
    expect(await screen.findByText("目标价监测中")).toBeTruthy();
    expect(document.body.textContent).not.toContain(ownerValue);
  });

  it("updates an existing active alert", async () => {
    vi.mocked(getPriceAlerts).mockResolvedValue([activeAlert]);
    vi.mocked(upsertPriceAlert).mockResolvedValue({ ...activeAlert, targetPrice: 20_499 });
    render(<PriceAlertControl hardwareKey={activeAlert.hardwareKey} hardwareName="RTX 5090" />);
    const input = await screen.findByRole("spinbutton", { name: "目标到手价" });

    fireEvent.change(input, { target: { value: "20499" } });
    fireEvent.click(screen.getByRole("button", { name: "更新提醒" }));

    await waitFor(() => {
      expect(upsertPriceAlert).toHaveBeenCalledWith(activeAlert.hardwareKey, 20_499, owner);
    });
  });

  it("renders a measured triggered state and deletes the alert", async () => {
    const triggeredAlert: PriceAlert = {
      ...activeAlert,
      currentBestPrice: 18_999,
      status: "TRIGGERED",
      triggeredAt: "2026-08-02T08:31:00",
    };
    vi.mocked(getPriceAlerts).mockResolvedValue([triggeredAlert]);
    vi.mocked(deletePriceAlert).mockResolvedValue(undefined);
    render(<PriceAlertControl hardwareKey={activeAlert.hardwareKey} hardwareName="RTX 5090" />);

    expect(await screen.findByText("已达目标价")).toBeTruthy();
    expect(screen.getByText(/当前最低.*¥18,999/)).toBeTruthy();
    expect(screen.getByText(/目标.*¥19,999/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "取消提醒" }));

    await waitFor(() => {
      expect(deletePriceAlert).toHaveBeenCalledWith(activeAlert.publicId, owner);
    });
    expect(await screen.findByRole("button", { name: "设置提醒" })).toBeTruthy();
  });

  it("announces loading and recoverable errors accessibly", async () => {
    vi.mocked(getPriceAlerts)
      .mockRejectedValueOnce(new Error("owner token must never render"))
      .mockResolvedValueOnce([]);
    render(<PriceAlertControl hardwareKey={activeAlert.hardwareKey} hardwareName="RTX 5090" />);

    expect(screen.getByRole("status").textContent).toContain("正在读取价格提醒");
    expect((await screen.findByRole("alert")).textContent).toContain("价格提醒暂不可用");
    expect(document.body.textContent).not.toContain("owner token must never render");

    fireEvent.click(screen.getByRole("button", { name: "重试价格提醒" }));
    expect(await screen.findByRole("button", { name: "设置提醒" })).toBeTruthy();
  });

  it("ignores an old alert-list response after hardware changes", async () => {
    const gpuRequest = deferred<readonly PriceAlert[]>();
    const cpuRequest = deferred<readonly PriceAlert[]>();
    vi.mocked(getPriceAlerts)
      .mockReturnValueOnce(gpuRequest.promise)
      .mockReturnValueOnce(cpuRequest.promise);
    const { rerender } = render(
      <PriceAlertControl hardwareKey={activeAlert.hardwareKey} hardwareName="RTX 5090" />,
    );
    rerender(<PriceAlertControl hardwareKey="cpu-intel-i9-14900k" hardwareName="i9-14900K" />);

    await act(async () => {
      cpuRequest.resolve([]);
    });
    expect(await screen.findByRole("button", { name: "设置提醒" })).toBeTruthy();
    await act(async () => {
      gpuRequest.resolve([activeAlert]);
    });

    await waitFor(() => {
      expect(screen.queryByText("目标价监测中")).toBeNull();
    });
  });

  it("keeps the new hardware loading when the old request rejects before effects settle", async () => {
    const gpuRequest = deferred<readonly PriceAlert[]>();
    const cpuRequest = deferred<readonly PriceAlert[]>();
    vi.mocked(getPriceAlerts)
      .mockReturnValueOnce(gpuRequest.promise)
      .mockReturnValueOnce(cpuRequest.promise);
    const { rerender } = render(
      <PriceAlertControl hardwareKey={activeAlert.hardwareKey} hardwareName="RTX 5090" />,
    );
    await waitFor(() => expect(getPriceAlerts).toHaveBeenCalledTimes(1));

    rerender(<PriceAlertControl hardwareKey="cpu-intel-i9-14900k" hardwareName="i9-14900K" />);
    await act(async () => {
      gpuRequest.reject(new Error("old owner failure"));
    });

    expect(screen.getByRole("status").textContent).toContain("正在读取价格提醒");
    expect(screen.queryByRole("alert")).toBeNull();
    await act(async () => {
      cpuRequest.resolve([]);
    });
    expect(await screen.findByRole("button", { name: "设置提醒" })).toBeTruthy();
  });
});
