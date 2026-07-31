import { describe, expect, it } from "vitest";
import { mockHardware } from "../data/mockHardware";
import { evaluateCompatibility } from "./CompatibilityEngine";
import { recommendBuild } from "./RecommendationEngine";

describe("RecommendationEngine", () => {
  it("returns a compatible gaming build within an 8000 yuan budget", () => {
    // Given
    const request = { budget: 8000, useCase: "gaming" as const };

    // When
    const result = recommendBuild(request, mockHardware);

    // Then
    expect(result.totalPrice).toBeLessThanOrEqual(request.budget);
    expect(result.overBudget).toBe(false);
    expect(evaluateCompatibility(result.components).status).not.toBe("error");
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("prioritizes a stronger AI score when more budget is available", () => {
    // Given / When
    const entry = recommendBuild({ budget: 8000, useCase: "ai" }, mockHardware);
    const workstation = recommendBuild({ budget: 30000, useCase: "ai" }, mockHardware);

    // Then
    expect(workstation.performance.ai).toBeGreaterThan(entry.performance.ai);
  });
});
