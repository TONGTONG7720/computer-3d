import { describe, expect, it } from "vitest";
import { createExplodedTransform } from "./ExplodedAnimation";

describe("createExplodedTransform", () => {
  it("adds the semantic slot offset while preserving the authored assembly pose", () => {
    const exploded = createExplodedTransform("gpu_slot", true);
    const assembled = createExplodedTransform("gpu_slot", false);

    expect(exploded.position[0]).toBeGreaterThan(assembled.position[0] + 2);
    expect(exploded.position[2]).toBeGreaterThan(assembled.position[2]);
    expect(assembled.rotation).toEqual([0, 0, 0]);
  });

  it("keeps the chassis fixed as the visual assembly reference", () => {
    expect(createExplodedTransform("pc_case", true)).toEqual(
      createExplodedTransform("pc_case", false),
    );
  });
});
