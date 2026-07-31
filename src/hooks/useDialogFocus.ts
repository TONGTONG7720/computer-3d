"use client";

import type { RefObject } from "react";
import { useEffect, useRef } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type DialogFocusOptions = {
  readonly dialogRef: RefObject<HTMLElement | null>;
  readonly initialFocusRef: RefObject<HTMLElement | null>;
  readonly isolationRootRef: RefObject<HTMLElement | null>;
  readonly onClose: () => void;
  readonly open: boolean;
};

const collectIsolationTargets = (isolationRoot: HTMLElement | null): HTMLElement[] => {
  const targets = new Set<HTMLElement>();
  let activeBranch = isolationRoot;

  while (activeBranch !== null) {
    const parent = activeBranch.parentElement;
    if (parent === null) {
      break;
    }
    for (const sibling of parent.children) {
      if (sibling instanceof HTMLElement && sibling !== activeBranch) {
        targets.add(sibling);
      }
    }
    if (parent === document.body) {
      break;
    }
    activeBranch = parent;
  }

  return Array.from(targets);
};

export function useDialogFocus({
  dialogRef,
  initialFocusRef,
  isolationRootRef,
  onClose,
  open,
}: DialogFocusOptions): void {
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const isolatedElements = collectIsolationTargets(isolationRootRef.current);
    const isolationState = isolatedElements.map((element) => ({
      element,
      ariaHidden: element.getAttribute("aria-hidden"),
      inert: element.inert === true,
    }));
    for (const element of isolatedElements) {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    }

    const focusInitialControl = () => {
      const target = initialFocusRef.current ?? dialogRef.current;
      target?.focus();
    };
    queueMicrotask(focusInitialControl);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const dialog = dialogRef.current;
      if (dialog === null) {
        return;
      }
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (first === undefined || last === undefined) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      for (const state of isolationState) {
        state.element.inert = state.inert;
        if (state.ariaHidden === null) {
          state.element.removeAttribute("aria-hidden");
        } else {
          state.element.setAttribute("aria-hidden", state.ariaHidden);
        }
      }
      previousFocus?.focus();
    };
  }, [dialogRef, initialFocusRef, isolationRootRef, open]);
}
