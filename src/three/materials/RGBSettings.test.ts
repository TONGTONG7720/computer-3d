import { describe, expect, it } from "vitest";
import { getRgbIntensity, normalizeRgbSettings } from "./RGBSettings";

describe("RGBSettings", () => {
  it("normalizes user controls into the safe renderer range", () => {
    expect(
      normalizeRgbSettings({
        brightness: 2,
        color: "#48D8FF",
        effect: "pulse",
        speed: 0,
      }),
    ).toEqual({ brightness: 1, color: "#48d8ff", effect: "pulse", speed: 0.25 });
  });

  it("keeps static light stable and pulse light bounded", () => {
    const settings = normalizeRgbSettings({
      brightness: 0.8,
      color: "#48d8ff",
      effect: "static",
      speed: 1,
    });
    expect(getRgbIntensity(settings, 10)).toBeCloseTo(1.44);

    const pulse = { ...settings, effect: "pulse" as const };
    expect(getRgbIntensity(pulse, 0)).toBeGreaterThanOrEqual(0.5);
    expect(getRgbIntensity(pulse, 1)).toBeLessThanOrEqual(1.8);
  });
});
