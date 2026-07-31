import { describe, expect, it } from "vitest";
import { getLodDistanceScale } from "./LODSystem";
import { selectQualityProfile } from "./QualityManager";

describe("LODSystem", () => {
  it("switches to lower detail sooner on mobile", () => {
    const desktop = selectQualityProfile({
      viewportWidth: 1440,
      devicePixelRatio: 2,
      reducedMotion: false,
    });
    const mobile = selectQualityProfile({
      viewportWidth: 390,
      devicePixelRatio: 3,
      reducedMotion: false,
    });

    expect(getLodDistanceScale(mobile)).toBeLessThan(getLodDistanceScale(desktop));
  });
});
