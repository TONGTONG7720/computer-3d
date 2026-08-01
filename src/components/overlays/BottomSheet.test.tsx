// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { BottomSheet } from "./BottomSheet";

function SheetHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)} type="button">
        打开组件
      </button>
      <BottomSheet onClose={() => setOpen(false)} open={open} side="left" title="选择组件">
        <button type="button">选择硬件</button>
      </BottomSheet>
    </div>
  );
}

describe("BottomSheet", () => {
  afterEach(() => cleanup());

  it("traps focus, closes on Escape, and restores focus to the launcher", async () => {
    render(<SheetHarness />);
    const launcher = screen.getByRole("button", { name: "打开组件" });
    launcher.focus();
    fireEvent.click(launcher);

    const dialog = await screen.findByRole("dialog", { name: "选择组件" });
    expect(dialog).toBeTruthy();
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "关闭选择组件" }));
    });

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "选择组件" })).toBeNull();
    });
    expect(document.activeElement).toBe(launcher);
  });
});
