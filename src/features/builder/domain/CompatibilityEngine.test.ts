import { describe, expect, it } from "vitest";
import { defaultSelectedComponents, hardwareByCategory } from "../data/mockHardware";
import { evaluateCompatibility } from "./CompatibilityEngine";
import type { SelectedComponents } from "./hardware";

describe("CompatibilityEngine", () => {
  it("marks the reference machine ready", () => {
    // Given / When
    const result = evaluateCompatibility(defaultSelectedComponents);

    // Then
    expect(result.status).toBe("success");
    expect(result.results.every((rule) => rule.status === "success")).toBe(true);
  });

  it("detects a CPU and motherboard socket mismatch", () => {
    // Given
    const selection: SelectedComponents = {
      ...defaultSelectedComponents,
      cpu: hardwareByCategory.cpu[1] ?? null,
    };

    // When
    const result = evaluateCompatibility(selection);

    // Then
    expect(result.status).toBe("error");
    expect(result.results).toContainEqual(
      expect.objectContaining({
        rule: "cpu-motherboard",
        status: "error",
      }),
    );
  });

  it("detects RAM generation and motherboard mismatch", () => {
    // Given
    const selection: SelectedComponents = {
      ...defaultSelectedComponents,
      motherboard: hardwareByCategory.motherboard[2] ?? null,
    };

    // When
    const result = evaluateCompatibility(selection);

    // Then
    expect(result.results).toContainEqual(
      expect.objectContaining({
        rule: "ram-motherboard",
        status: "error",
      }),
    );
  });

  it("detects GPU length, cooling TDP and PSU capacity independently", () => {
    // Given
    const compactCase: SelectedComponents = {
      ...defaultSelectedComponents,
      case: hardwareByCategory.case[1] ?? null,
    };
    const smallCooling: SelectedComponents = {
      ...defaultSelectedComponents,
      cooling: hardwareByCategory.cooling[0] ?? null,
    };
    const smallPsu: SelectedComponents = {
      ...defaultSelectedComponents,
      power_supply: hardwareByCategory.power_supply[0] ?? null,
    };

    // When
    const caseResult = evaluateCompatibility(compactCase);
    const coolingResult = evaluateCompatibility(smallCooling);
    const psuResult = evaluateCompatibility(smallPsu);

    // Then
    expect(caseResult.results).toContainEqual(
      expect.objectContaining({ rule: "gpu-case", status: "error" }),
    );
    expect(coolingResult.results).toContainEqual(
      expect.objectContaining({ rule: "cooling-cpu", status: "error" }),
    );
    expect(psuResult.results).toContainEqual(
      expect.objectContaining({ rule: "psu-power", status: "error" }),
    );
  });
});
