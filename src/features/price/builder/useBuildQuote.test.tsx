// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getBuildQuote } from "../api/PriceApiClient";
import type { BuildQuote } from "../domain/price";
import { deferred } from "./PriceComparisonDialog.fixtures";
import { useBuildQuote } from "./useBuildQuote";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

vi.mock("../api/PriceApiClient", () => ({
  getBuildQuote: vi.fn(),
}));

const quoteFixture = (lowestTotal: number): BuildQuote => ({
  components: [],
  internalTotal: lowestTotal + 1_400,
  lowestTotal,
  recommendedTotal: lowestTotal + 200,
  savings: 1_400,
  pricedComponentCount: 1,
  componentCount: 1,
  complete: true,
  disclosure: "V1 为人工维护报价。",
  updatedAt: "2026-08-02T08:30:00",
});

type QuoteHarnessProps = {
  readonly hardwareKeys: readonly string[];
  readonly onCommittedQuote?: (lowestTotal: number | null) => void;
};

function QuoteHarness({ hardwareKeys, onCommittedQuote }: QuoteHarnessProps) {
  const { quote, retry, status } = useBuildQuote(hardwareKeys);

  useLayoutEffect(() => {
    onCommittedQuote?.(quote?.lowestTotal ?? null);
  }, [onCommittedQuote, quote]);

  return (
    <section>
      <output aria-label="硬件签名">{hardwareKeys.join(",")}</output>
      <output aria-label="报价状态">{status}</output>
      <output aria-label="最低总价">{quote?.lowestTotal ?? "—"}</output>
      <button onClick={retry} type="button">
        重试
      </button>
    </section>
  );
}

describe("useBuildQuote", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.mocked(getBuildQuote).mockReset();
    vi.mocked(getBuildQuote).mockResolvedValue(quoteFixture(10_000));
  });

  it("does not request an identical hardware signature again when array identity changes", async () => {
    const { rerender } = render(<QuoteHarness hardwareKeys={["cpu-same"]} />);
    await waitFor(() => expect(screen.getByLabelText("报价状态").textContent).toBe("success"));

    rerender(<QuoteHarness hardwareKeys={["cpu-same"]} />);
    await Promise.resolve();

    expect(getBuildQuote).toHaveBeenCalledOnce();
  });

  it("shares the mount request replayed by React StrictMode", async () => {
    render(
      <StrictMode>
        <QuoteHarness hardwareKeys={["gpu-strict"]} />
      </StrictMode>,
    );

    await waitFor(() => expect(screen.getByLabelText("报价状态").textContent).toBe("success"));
    expect(getBuildQuote).toHaveBeenCalledOnce();
  });

  it("forces a new request when retry is explicit", async () => {
    const automaticRequest = deferred<BuildQuote>();
    const retryRequest = deferred<BuildQuote>();
    vi.mocked(getBuildQuote)
      .mockImplementationOnce(() => automaticRequest.promise)
      .mockImplementationOnce(() => retryRequest.promise);
    render(<QuoteHarness hardwareKeys={["memory-retry"]} />);
    await waitFor(() => expect(getBuildQuote).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    await waitFor(() => expect(getBuildQuote).toHaveBeenCalledTimes(2));
    retryRequest.resolve(quoteFixture(8_000));
    await retryRequest.promise;
    await waitFor(() => expect(screen.getByLabelText("最低总价").textContent).toBe("8000"));

    automaticRequest.resolve(quoteFixture(9_000));
    await automaticRequest.promise;
    await Promise.resolve();
    expect(screen.getByLabelText("最低总价").textContent).toBe("8000");
  });

  it("maps a non-Error rejection to the quote error state", async () => {
    vi.mocked(getBuildQuote).mockRejectedValue("offline");
    render(<QuoteHarness hardwareKeys={["storage-error"]} />);

    await waitFor(() => expect(screen.getByLabelText("报价状态").textContent).toBe("error"));
  });

  it("ignores an old response after the new selection commits but before its passive request", async () => {
    const oldRequest = deferred<BuildQuote>();
    const newRequest = deferred<BuildQuote>();
    const committedTotals: Array<number | null> = [];
    const container = document.createElement("div");
    const root = createRoot(container);
    const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
    document.body.append(container);
    vi.mocked(getBuildQuote).mockImplementation((hardwareKeys) =>
      hardwareKeys.includes("gpu-new") ? newRequest.promise : oldRequest.promise,
    );

    try {
      root.render(
        <QuoteHarness
          hardwareKeys={["gpu-old"]}
          onCommittedQuote={(total) => committedTotals.push(total)}
        />,
      );
      await waitFor(() => expect(getBuildQuote).toHaveBeenCalledWith(["gpu-old"]));
      const selectionCommitted = new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          if (container.textContent?.includes("gpu-new")) {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(container, { characterData: true, childList: true, subtree: true });
      });

      root.render(
        <QuoteHarness
          hardwareKeys={["gpu-new"]}
          onCommittedQuote={(total) => committedTotals.push(total)}
        />,
      );
      await selectionCommitted;
      oldRequest.resolve(quoteFixture(9_000));
      await oldRequest.promise;
      await waitFor(() => expect(getBuildQuote).toHaveBeenCalledWith(["gpu-new"]));
      newRequest.resolve(quoteFixture(8_000));
      await newRequest.promise;
      await waitFor(() => expect(committedTotals).toContain(8_000));

      expect(committedTotals).not.toContain(9_000);
    } finally {
      root.unmount();
      container.remove();
      globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    }
  });
});
