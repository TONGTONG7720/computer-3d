import { describe, expect, it } from "vitest";
import { defaultSelectedComponents, hardwareByCategory, mockHardware } from "./mockHardware";

describe("mockHardware", () => {
  it("contains every Builder V1 hardware category", () => {
    // Given
    const expectedCategories = [
      "cpu",
      "gpu",
      "motherboard",
      "ram",
      "storage",
      "cooling",
      "power_supply",
      "case",
    ] as const;

    // When
    const categoryCounts = expectedCategories.map(
      (category) => hardwareByCategory[category].length,
    );

    // Then
    expect(categoryCounts.every((count) => count >= 2)).toBe(true);
  });

  it("uses unique ids and local GLB model paths", () => {
    // Given
    const ids = mockHardware.map((hardware) => hardware.id);

    // When
    const uniqueIds = new Set(ids);

    // Then
    expect(uniqueIds.size).toBe(ids.length);
    expect(mockHardware.every((hardware) => /^\/models\/.+\.glb$/.test(hardware.modelUrl))).toBe(
      true,
    );
  });

  it("starts from a complete reference machine", () => {
    // Given / When
    const selectedCount = Object.values(defaultSelectedComponents).filter(
      (component) => component !== null,
    ).length;

    // Then
    expect(selectedCount).toBe(8);
  });
});
