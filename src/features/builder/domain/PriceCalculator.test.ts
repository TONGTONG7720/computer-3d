import { describe, expect, it } from "vitest";
import { defaultSelectedComponents } from "../data/mockHardware";
import { calculatePowerUsage, calculateTotalPrice } from "./PriceCalculator";

describe("PriceCalculator", () => {
  it("sums the selected component prices", () => {
    // Given
    const expected = Object.values(defaultSelectedComponents).reduce(
      (total, component) => total + (component?.price ?? 0),
      0,
    );

    // When
    const price = calculateTotalPrice(defaultSelectedComponents);

    // Then
    expect(price).toBe(expected);
  });

  it("excludes PSU capacity from system power draw", () => {
    // Given
    const expected = Object.entries(defaultSelectedComponents).reduce(
      (total, [category, component]) =>
        total + (category === "power_supply" ? 0 : (component?.power ?? 0)),
      0,
    );

    // When
    const power = calculatePowerUsage(defaultSelectedComponents);

    // Then
    expect(power).toBe(expected);
  });
});
