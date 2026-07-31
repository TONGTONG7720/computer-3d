import { describe, expect, it } from "vitest";
import { createEngineStore } from "./engineStore";

describe("engineStore", () => {
  it("starts with the approved PC LAB demo hardware", () => {
    const store = createEngineStore();

    expect(store.getState().selectedHardware).toEqual({
      cpu: "cpu-intel-i9-14900k",
      gpu: "gpu-nvidia-rtx5090",
    });
    expect(store.getState().exploded).toBe(false);
  });

  it("queues a typed replacement command without storing Three.js objects", () => {
    const store = createEngineStore();

    store.getState().requestReplacement({
      slot: "gpu",
      assetId: "gpu-nvidia-rtx5090-aurora",
      modelUrl: "/models/gpu_rtx5090_aurora.glb",
      variant: "aurora",
    });

    expect(store.getState().replacementRequest).toMatchObject({
      requestId: 1,
      slot: "gpu",
      assetId: "gpu-nvidia-rtx5090-aurora",
    });
  });

  it("cycles the finite RGB modes and increments camera resets", () => {
    const store = createEngineStore();

    store.getState().cycleRgb();
    store.getState().resetCamera();

    expect(store.getState().rgbMode).toBe("violet");
    expect(store.getState().cameraRevision).toBe(1);
  });

  it("moves between overview and internal camera modes", () => {
    const store = createEngineStore();

    store.getState().focusInternal();
    expect(store.getState().cameraMode).toBe("internal");

    store.getState().focusInternal();
    expect(store.getState().cameraMode).toBe("overview");
  });

  it("returns to the overview camera before entering exploded view", () => {
    const store = createEngineStore();
    store.getState().focusInternal();

    store.getState().toggleExploded();

    expect(store.getState().exploded).toBe(true);
    expect(store.getState().cameraMode).toBe("overview");
  });
});
