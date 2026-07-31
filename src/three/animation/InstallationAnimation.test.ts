import { describe, expect, it } from "vitest";
import { createInstallationPlan, installationPhases } from "./InstallationAnimation";

describe("createInstallationPlan", () => {
  it("keeps the approved seven installation phases", () => {
    expect(installationPhases).toEqual([
      "waiting",
      "floating",
      "moving",
      "rotating",
      "inserting",
      "locked",
      "glowing",
    ]);
  });

  it("builds an entry pose and finishes at the assembled transform", () => {
    const plan = createInstallationPlan({
      assembledPosition: [0.2, 2.1, -0.4],
      assembledRotation: [0, 0.1, 0],
      entryOffset: [2.4, 0.5, 0],
      durationMs: 1200,
    });

    expect(plan.start.position).toEqual([2.6, 2.6, -0.4]);
    expect(plan.end.position).toEqual([0.2, 2.1, -0.4]);
    expect(plan.durationMs).toBe(1200);
    expect(plan.ease).toBe("power3.out");
  });
});
