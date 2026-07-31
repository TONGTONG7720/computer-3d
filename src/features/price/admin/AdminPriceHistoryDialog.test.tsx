// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getPriceHistory } from "../api/PriceApiClient";
import { history } from "../builder/PriceComparisonDialog.fixtures";
import { AdminPriceHistoryDialog } from "./AdminPriceHistoryDialog";

vi.mock("../api/PriceApiClient", () => ({
  getPriceHistory: vi.fn(),
}));

describe("AdminPriceHistoryDialog", () => {
  afterEach(() => cleanup());

  it("portals the modal outside a transformed editor drawer", async () => {
    vi.mocked(getPriceHistory).mockResolvedValue(history);
    render(
      <aside style={{ transform: "translateX(0)" }}>
        <AdminPriceHistoryDialog
          hardwareId="3"
          hardwareName="ASUS RTX 5090 32GB Gaming OC"
          onClose={vi.fn()}
          open
        />
      </aside>,
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(await screen.findByText("变更明细")).toBeTruthy();
  });
});
