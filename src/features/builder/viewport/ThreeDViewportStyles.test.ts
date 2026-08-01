import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("ThreeDViewport mobile touch contract", () => {
  it("keeps every mode button at the shared 44px touch target", () => {
    const stylesheet = readFileSync(
      new URL("./ThreeDViewport.module.css", import.meta.url),
      "utf8",
    );

    expect(stylesheet).toContain("min-height: var(--touch-target)");
    expect(stylesheet).not.toContain("overflow-x: auto");
  });
});
