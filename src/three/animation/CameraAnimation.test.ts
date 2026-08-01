import { describe, expect, it } from "vitest";
import { getCameraPreset } from "./CameraAnimation";

describe("camera presets", () => {
  it("frames an installation closer than the default build view", () => {
    // Given
    const defaultView = getCameraPreset("default");

    // When
    const installationView = getCameraPreset("installation");

    // Then
    expect(installationView.position[2]).toBeLessThan(defaultView.position[2]);
    expect(installationView.fov).toBeLessThanOrEqual(defaultView.fov);
  });

  it("pulls back for the exploded assembly", () => {
    // Given
    const defaultView = getCameraPreset("default");

    // When
    const explodedView = getCameraPreset("exploded");

    // Then
    expect(explodedView.position[0]).toBeGreaterThan(defaultView.position[0]);
    expect(explodedView.position[2]).toBeGreaterThan(defaultView.position[2]);
  });
});
