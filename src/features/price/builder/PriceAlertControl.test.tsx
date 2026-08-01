// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
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
const gpuControl = (
  <PriceAlertControl hardwareKey={activeAlert.hardwareKey} hardwareName="RTX 5090" />
);
const cpuControl = <PriceAlertControl hardwareKey="cpu-intel-i9-14900k" hardwareName="i9-14900K" />;

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

  it("renders a labelled control while no alert exists", async () => {
    vi.mocked(getPriceAlerts).mockResolvedValue([]);
    render(gpuControl);

    const input = await screen.findByRole("spinbutton", { name: "目标到手价" });
    expect(input.getAttribute("inputmode")).toBe("decimal");
    expect(screen.getByRole("button", { name: "设置提醒" })).toBeTruthy();
  });

  it("creates an alert and renders the active state", async () => {
    vi.mocked(getPriceAlerts).mockResolvedValue([]);
    vi.mocked(upsertPriceAlert).mockResolvedValue(activeAlert);
    render(gpuControl);
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
    render(gpuControl);
    const input = await screen.findByRole("spinbutton", { name: "目标到手价" });
    fireEvent.change(input, { target: { value: "20499" } });
    fireEvent.click(screen.getByRole("button", { name: "更新提醒" }));

    await waitFor(() => {
      expect(upsertPriceAlert).toHaveBeenCalledWith(activeAlert.hardwareKey, 20_499, owner);
    });
  });

  it("renders a measured triggered state and deletes the alert", async () => {
    vi.mocked(getPriceAlerts).mockResolvedValue([
      {
        ...activeAlert,
        currentBestPrice: 18_999,
        status: "TRIGGERED",
        triggeredAt: "2026-08-02T08:31:00",
      },
    ]);
    vi.mocked(deletePriceAlert).mockResolvedValue(undefined);
    render(gpuControl);

    expect(await screen.findByText("已达目标价")).toBeTruthy();
    expect(screen.getByText(/当前最低.*¥18,999/)).toBeTruthy();
    expect(screen.getByText(/目标.*¥19,999/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "取消提醒" }));
    await waitFor(() => {
      expect(deletePriceAlert).toHaveBeenCalledWith(activeAlert.publicId, owner);
    });
    expect(await screen.findByRole("button", { name: "设置提醒" })).toBeTruthy();
  });

  it.each(["resolve", "reject"] as const)(
    "announces and locks the control while a delete will %s",
    async (settlement) => {
      const request = deferred<void>();
      vi.mocked(getPriceAlerts).mockResolvedValue([activeAlert]);
      vi.mocked(deletePriceAlert).mockReturnValue(request.promise);
      render(gpuControl);

      const input = await screen.findByRole("spinbutton", { name: "目标到手价" });
      const update = screen.getByRole("button", { name: "更新提醒" });
      const remove = screen.getByRole("button", { name: "取消提醒" });
      fireEvent.click(remove);

      expect(screen.getByRole("status").textContent).toContain("正在取消提醒");
      expect((input as HTMLInputElement).disabled).toBe(true);
      expect((update as HTMLButtonElement).disabled).toBe(true);
      expect((remove as HTMLButtonElement).disabled).toBe(true);
      await act(async () => {
        settlement === "resolve"
          ? request.resolve(undefined)
          : request.reject(new Error("private delete failure"));
      });

      if (settlement === "resolve") {
        expect(await screen.findByRole("button", { name: "设置提醒" })).toBeTruthy();
      } else {
        expect((await screen.findByRole("alert")).textContent).toContain("价格提醒暂不可用");
        expect(document.body.textContent).not.toContain("private delete failure");
      }
    },
  );

  it("announces loading and recoverable errors accessibly", async () => {
    vi.mocked(getPriceAlerts)
      .mockRejectedValueOnce(new Error("owner token must never render"))
      .mockResolvedValueOnce([]);
    render(gpuControl);

    expect(screen.getByRole("status").textContent).toContain("正在读取价格提醒");
    expect((await screen.findByRole("alert")).textContent).toContain("价格提醒暂不可用");
    expect(document.body.textContent).not.toContain("owner token must never render");
    fireEvent.click(screen.getByRole("button", { name: "重试价格提醒" }));
    expect(await screen.findByRole("button", { name: "设置提醒" })).toBeTruthy();
  });

  it.each(["resolve", "reject"] as const)(
    "isolates a stale alert-list %s after hardware changes",
    async (settlement) => {
      const gpuRequest = deferred<readonly PriceAlert[]>();
      const cpuRequest = deferred<readonly PriceAlert[]>();
      vi.mocked(getPriceAlerts)
        .mockReturnValueOnce(gpuRequest.promise)
        .mockReturnValueOnce(cpuRequest.promise);
      const { rerender } = render(gpuControl);
      if (settlement === "reject") {
        await waitFor(() => expect(getPriceAlerts).toHaveBeenCalledTimes(1));
      }
      rerender(cpuControl);

      if (settlement === "resolve") {
        await act(async () => cpuRequest.resolve([]));
        expect(await screen.findByRole("button", { name: "设置提醒" })).toBeTruthy();
        await act(async () => gpuRequest.resolve([activeAlert]));
        await waitFor(() => expect(screen.queryByText("目标价监测中")).toBeNull());
      } else {
        await act(async () => gpuRequest.reject(new Error("old owner failure")));
        expect(screen.getByRole("status").textContent).toContain("正在读取价格提醒");
        expect(screen.queryByRole("alert")).toBeNull();
        await act(async () => cpuRequest.resolve([]));
        expect(await screen.findByRole("button", { name: "设置提醒" })).toBeTruthy();
      }
    },
  );

  it.each([
    ["upsert", "resolve"],
    ["upsert", "reject"],
    ["delete", "resolve"],
    ["delete", "reject"],
  ] as const)("ignores a pending %s %s after hardware changes", async (mutation, settlement) => {
    const saveRequest = deferred<PriceAlert>();
    const deleteRequest = deferred<void>();
    if (mutation === "upsert") {
      vi.mocked(getPriceAlerts).mockResolvedValue([]);
      vi.mocked(upsertPriceAlert).mockReturnValue(saveRequest.promise);
    } else {
      vi.mocked(getPriceAlerts).mockResolvedValueOnce([activeAlert]).mockResolvedValueOnce([]);
      vi.mocked(deletePriceAlert).mockReturnValue(deleteRequest.promise);
    }
    const { rerender } = render(gpuControl);
    if (mutation === "upsert") {
      const input = await screen.findByRole("spinbutton", { name: "目标到手价" });
      fireEvent.change(input, { target: { value: "19999" } });
      fireEvent.click(screen.getByRole("button", { name: "设置提醒" }));
      await waitFor(() => expect(upsertPriceAlert).toHaveBeenCalledTimes(1));
    } else {
      fireEvent.click(await screen.findByRole("button", { name: "取消提醒" }));
      await waitFor(() => expect(deletePriceAlert).toHaveBeenCalledTimes(1));
    }

    rerender(cpuControl);
    const cpuInput = await screen.findByRole("spinbutton", { name: "目标到手价" });
    await act(async () => {
      if (mutation === "upsert") {
        settlement === "resolve"
          ? saveRequest.resolve(activeAlert)
          : saveRequest.reject(new Error("old save failure"));
      } else {
        settlement === "resolve"
          ? deleteRequest.resolve(undefined)
          : deleteRequest.reject(new Error("old delete failure"));
      }
    });

    expect((cpuInput as HTMLInputElement).value).toBe("");
    expect(screen.getByRole("button", { name: "设置提醒" })).toBeTruthy();
    expect(screen.queryByText("目标价监测中")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("performs exactly one upsert and delete per click in StrictMode", async () => {
    vi.mocked(getPriceAlerts).mockResolvedValue([]);
    vi.mocked(upsertPriceAlert).mockResolvedValue(activeAlert);
    vi.mocked(deletePriceAlert).mockResolvedValue(undefined);
    render(<StrictMode>{gpuControl}</StrictMode>);
    const input = await screen.findByRole("spinbutton", { name: "目标到手价" });
    fireEvent.change(input, { target: { value: "19999" } });
    fireEvent.click(screen.getByRole("button", { name: "设置提醒" }));

    await screen.findByText("目标价监测中");
    expect(upsertPriceAlert).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "取消提醒" }));
    await screen.findByRole("button", { name: "设置提醒" });
    expect(deletePriceAlert).toHaveBeenCalledTimes(1);
  });
});
