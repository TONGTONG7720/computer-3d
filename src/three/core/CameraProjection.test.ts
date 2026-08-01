import { PerspectiveCamera } from "three";
import { describe, expect, it } from "vitest";
import { applyPerspectiveFov } from "./CameraProjection";

describe("applyPerspectiveFov", () => {
  it("updates the camera value and projection matrix as one operation", () => {
    const camera = new PerspectiveCamera(34, 1, 0.1, 80);
    const before = camera.projectionMatrix.clone();

    applyPerspectiveFov(camera, 42);

    expect(camera.fov).toBe(42);
    expect(camera.projectionMatrix.equals(before)).toBe(false);
  });
});
