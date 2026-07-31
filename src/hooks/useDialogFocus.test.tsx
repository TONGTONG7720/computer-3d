// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { useDialogFocus } from "./useDialogFocus";

function NestedDialogHarness() {
  const [open, setOpen] = useState(false);
  const isolationRootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useDialogFocus({
    dialogRef,
    initialFocusRef: closeButtonRef,
    isolationRootRef,
    onClose: () => setOpen(false),
    open,
  });

  return (
    <main>
      <button onClick={() => setOpen(true)} type="button">
        打开筛选
      </button>
      <section>
        <p data-testid="section-background">筛选区背景</p>
        {open ? (
          <div ref={isolationRootRef}>
            <section aria-label="嵌套筛选" aria-modal="true" ref={dialogRef} role="dialog">
              <button ref={closeButtonRef} type="button">
                关闭筛选
              </button>
              <button type="button">应用筛选</button>
            </section>
          </div>
        ) : null}
      </section>
      <aside aria-hidden="false" data-testid="outside-background">
        页面背景
      </aside>
    </main>
  );
}

describe("useDialogFocus", () => {
  afterEach(cleanup);

  it("isolates every ancestor branch, loops focus, and restores prior state", async () => {
    render(<NestedDialogHarness />);
    const launcher = screen.getByRole("button", { name: "打开筛选" });
    const outside = screen.getByTestId("outside-background");
    const sectionBackground = screen.getByTestId("section-background");

    launcher.focus();
    fireEvent.click(launcher);

    const closeButton = await screen.findByRole("button", { name: "关闭筛选" });
    const applyButton = screen.getByRole("button", { name: "应用筛选" });
    await waitFor(() => expect(document.activeElement).toBe(closeButton));
    expect(launcher.inert).toBe(true);
    expect(outside.inert).toBe(true);
    expect(outside.getAttribute("aria-hidden")).toBe("true");
    expect(sectionBackground.inert).toBe(true);

    applyButton.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(closeButton);
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(applyButton);

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(launcher);
    expect(launcher.inert).toBe(false);
    expect(outside.inert).toBe(false);
    expect(outside.getAttribute("aria-hidden")).toBe("false");
    expect(sectionBackground.inert).toBe(false);
    expect(sectionBackground.hasAttribute("aria-hidden")).toBe(false);
  });
});
