import { createRoot, type Root } from "react-dom/client";
import { parseHardwareId } from "@/features/builder/domain/hardware";
import type { PriceComparison, PriceHistory } from "../domain/price";
import { comparison, history } from "./PriceComparisonDialog.fixtures";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

export const oldHardwareId = parseHardwareId("gpu-nvidia-rtx5090");
export const newHardwareId = parseHardwareId("gpu-nvidia-rtx5080");
export const newComparison: PriceComparison = {
  ...comparison,
  hardwareKey: newHardwareId,
  hardwareName: "NVIDIA GeForce RTX 5080",
};
export const ninetyDayHistory: PriceHistory = {
  ...history,
  hardwareKey: newHardwareId,
  range: "90D",
};

export type ComparisonTestRoot = {
  readonly container: HTMLDivElement;
  readonly root: Root;
  readonly unmount: () => void;
};

export const createComparisonTestRoot = (): ComparisonTestRoot => {
  const container = document.createElement("div");
  const root = createRoot(container);
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  document.body.append(container);

  return {
    container,
    root,
    unmount: () => {
      root.unmount();
      container.remove();
      globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    },
  };
};

export type SignatureCommitObserver = {
  readonly disconnect: () => void;
  readonly firstCommit: Promise<string>;
  readonly snapshots: string[];
};

export const observeSignatureCommits = (
  container: HTMLElement,
  signature: string,
): SignatureCommitObserver => {
  const snapshots: string[] = [];
  let resolveFirstCommit: ((markup: string) => void) | null = null;
  const firstCommit = new Promise<string>((resolve) => {
    resolveFirstCommit = resolve;
  });
  const observer = new MutationObserver(() => {
    if (!container.textContent?.includes(signature)) {
      return;
    }
    const markup = container.innerHTML;
    snapshots.push(markup);
    resolveFirstCommit?.(markup);
    resolveFirstCommit = null;
  });
  observer.observe(container, { characterData: true, childList: true, subtree: true });

  return { disconnect: () => observer.disconnect(), firstCommit, snapshots };
};

export const observeFirstSignatureCommit = (
  container: HTMLElement,
  signature: string,
): Promise<string> =>
  new Promise<string>((resolve) => {
    const observer = new MutationObserver(() => {
      if (container.textContent?.includes(signature)) {
        const markup = container.innerHTML;
        observer.disconnect();
        resolve(markup);
      }
    });
    observer.observe(container, { characterData: true, childList: true, subtree: true });
  });
