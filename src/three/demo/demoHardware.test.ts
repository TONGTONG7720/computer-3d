import { describe, expect, it } from "vitest";
import { demoCpuOptions, demoGpuOptions, fixedDemoHardware } from "./demoHardware";

describe("demoHardware", () => {
  it("contains the required Engine V1.0 hardware", () => {
    expect(demoCpuOptions.some((option) => option.name === "Intel i9-14900K")).toBe(true);
    expect(demoGpuOptions.some((option) => option.name === "RTX 5090")).toBe(true);
    expect(fixedDemoHardware.ram.name).toBe("DDR5 64GB");
    expect(fixedDemoHardware.case.name).toBe("Future Glass Case");
  });

  it("uses local GLB paths while declaring procedural fallback", () => {
    for (const option of [...demoCpuOptions, ...demoGpuOptions]) {
      expect(option.manifest.url).toMatch(/^\/models\/.+\.glb$/);
      expect(option.manifest.fallback).toBe("placeholder");
    }
  });
});
