import { describe, expect, it } from "vitest";
import { airflowPaths, getAirflowParticleBudget, sampleAirflowPath } from "./AirflowSystem";

describe("AirflowSystem", () => {
  it("defines cold intake and warm exhaust routes through the thermal zones", () => {
    expect(airflowPaths.some((path) => path.kind === "intake")).toBe(true);
    expect(airflowPaths.some((path) => path.kind === "exhaust")).toBe(true);

    const intake = airflowPaths.find((path) => path.kind === "intake");
    expect(intake).toBeDefined();
    if (intake !== undefined) {
      expect(sampleAirflowPath(intake, 0)).toEqual(intake.start);
      expect(sampleAirflowPath(intake, 1)).toEqual(intake.end);
    }
  });

  it("uses a smaller deterministic particle budget on mobile", () => {
    expect(getAirflowParticleBudget(true)).toBeLessThan(getAirflowParticleBudget(false));
    expect(getAirflowParticleBudget(true)).toBeGreaterThanOrEqual(30);
  });
});
