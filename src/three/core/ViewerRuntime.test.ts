import { PCFShadowMap } from "three";
import { describe, expect, it } from "vitest";
import {
  getViewerShadowMapType,
  resolveCameraView,
  shouldRenderContinuously,
} from "./ViewerRuntime";

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

  it("uses the supported PCF shadow path without Three.js deprecation warnings", () => {
    expect(getViewerShadowMapType()).toBe(PCFShadowMap);
  });
});
