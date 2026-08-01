import { describe, expect, it } from "vitest";
import { resolveCameraView, shouldRenderContinuously } from "./ViewerRuntime";

describe("ViewerRuntime", () => {
  it("maps presentation modes and active installation to intentional camera views", () => {
    expect(resolveCameraView("build", false, false)).toBe("default");
    expect(resolveCameraView("build", true, false)).toBe("detail");
    expect(resolveCameraView("exploded", false, false)).toBe("exploded");
    expect(resolveCameraView("studio", false, true)).toBe("installation");
  });

  it("keeps demand rendering except for animated airflow and RGB effects", () => {
    expect(shouldRenderContinuously("build", "static")).toBe(false);
    expect(shouldRenderContinuously("airflow", "static")).toBe(true);
    expect(shouldRenderContinuously("studio", "pulse")).toBe(true);
    expect(shouldRenderContinuously("studio", "wave")).toBe(true);
  });
});
