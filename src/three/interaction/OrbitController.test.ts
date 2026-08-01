import { describe, expect, it } from "vitest";
import { getOrbitLimits } from "./OrbitController";

describe("OrbitController limits", () => {
  it("keeps the complete tower framed farther away on mobile", () => {
    // Given
    const desktop = getOrbitLimits(false);

    // When
    const mobile = getOrbitLimits(true);

    // Then
    expect(mobile.minDistance).toBeGreaterThan(desktop.minDistance);
    expect(mobile.maxDistance).toBeGreaterThan(desktop.maxDistance);
    expect(mobile.maxPolarAngle).toBeLessThan(Math.PI);
  });
});
