import { describe, expect, it } from "vitest";
import { selectQualityProfile } from "./QualityManager";

describe("selectQualityProfile", () => {
  it("uses the high-quality desktop profile within the DPR budget", () => {
    const profile = selectQualityProfile({
      devicePixelRatio: 2,
      viewportWidth: 1440,
      reducedMotion: false,
    });

    expect(profile.id).toBe("desktop-high");
    expect(profile.maxDpr).toBe(1.5);
    expect(profile.shadows).toBe(true);
    expect(profile.bloom).toBe(true);
  });

  it("disables expensive effects on mobile", () => {
    const profile = selectQualityProfile({
      devicePixelRatio: 3,
      viewportWidth: 390,
      reducedMotion: false,
    });

    expect(profile.id).toBe("mobile");
    expect(profile.maxDpr).toBe(1.25);
    expect(profile.shadowMapSize).toBe(1024);
    expect(profile.bloom).toBe(false);
  });

  it("removes mechanical travel when reduced motion is requested", () => {
    const profile = selectQualityProfile({
      devicePixelRatio: 1,
      viewportWidth: 1440,
      reducedMotion: true,
    });

    expect(profile.motionScale).toBe(0);
  });
});
