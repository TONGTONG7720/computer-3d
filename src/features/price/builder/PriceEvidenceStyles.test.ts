import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readWorkspaceFile = (path: string): string =>
  readFileSync(resolve(process.cwd(), path), "utf8");

const ruleBody = (source: string, selector: RegExp): string => {
  const match = source.match(new RegExp(`${selector.source}\\s*\\{([^}]*)\\}`, selector.flags));
  expect(match, `Missing CSS rule: ${selector.source}`).not.toBeNull();
  return match?.[1] ?? "";
};

describe("Price Intelligence CSS contracts", () => {
  it("keeps the shared touch token at 44px and applies it to alert controls", () => {
    const tokens = readWorkspaceFile("src/styles/tokens.css");
    const alertStyles = readWorkspaceFile(
      "src/features/price/builder/PriceAlertControl.module.css",
    );

    expect(tokens).toMatch(/--touch-target:\s*44px\s*;/);
    expect(ruleBody(alertStyles, /\.alertActions input/)).toMatch(
      /min-height:\s*var\(--touch-target\)\s*;/,
    );
    expect(ruleBody(alertStyles, /\.alertActions button,\s*\.alertError button/)).toMatch(
      /min-height:\s*var\(--touch-target\)\s*;/,
    );
  });

  it("keeps lowest-price evidence neutral and pending-review evidence warning-toned", () => {
    const offerStyles = readWorkspaceFile("src/features/price/builder/PriceOfferCard.module.css");

    expect(ruleBody(offerStyles, /strong\[data-badge-tone="neutral"\]/)).toMatch(
      /color:\s*var\(--color-text-secondary\)\s*;/,
    );
    expect(ruleBody(offerStyles, /strong\[data-badge-tone="warning"\]/)).toMatch(
      /color:\s*var\(--color-warning\)\s*;/,
    );
  });
});
