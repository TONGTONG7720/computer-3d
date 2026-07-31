import { describe, expect, it } from "vitest";
import { defaultSelectedComponents, hardwareByCategory } from "../data/mockHardware";
import { calculatePerformance } from "./PerformanceCalculator";

describe("PerformanceCalculator", () => {
  it("returns four scores within the 0 to 100 range", () => {
    // Given / When
    const score = calculatePerformance(defaultSelectedComponents);

    // Then
    expect(Object.values(score).every((value) => value >= 0 && value <= 100)).toBe(true);
  });

  it("reduces gaming and AI scores when a flagship GPU is replaced by RTX 5070", () => {
    // Given
    const baseline = calculatePerformance(defaultSelectedComponents);
    const lowerGpu = hardwareByCategory.gpu.find((gpu) => gpu.id === "gpu-nvidia-rtx5070");

    // When
    const downgraded = calculatePerformance({
      ...defaultSelectedComponents,
      gpu: lowerGpu ?? null,
    });

    // Then
    expect(downgraded.gaming).toBeLessThan(baseline.gaming);
    expect(downgraded.ai).toBeLessThan(baseline.ai);
  });
});
