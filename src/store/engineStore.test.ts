import { describe, expect, it } from "vitest";
import { createEngineStore } from "./engineStore";

describe("engineStore", () => {
  it("starts with the approved PC LAB demo hardware", () => {
    const store = createEngineStore();

    expect(store.getState().selectedHardware).toMatchObject({
      cpu: "cpu-intel-i9-14900k",
      gpu: "gpu-nvidia-rtx5090",
      motherboard: "motherboard-z790-lab",
      ram: "ram-ddr5-64gb",
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

  it("serializes multiple scene replacements through a queue", () => {
    // Given
    const store = createEngineStore();

    // When
    store.getState().requestReplacement({
      slot: "cpu",
      assetId: "cpu-amd-7800x3d",
      modelUrl: "/models/cpu_ryzen_7800x3d.glb",
      variant: "amd-7800x3d",
    });
    store.getState().requestReplacement({
      slot: "motherboard",
      assetId: "motherboard-b650-lab",
      modelUrl: "/models/motherboard_b650m_lab.glb",
      variant: "b650",
    });
    const activeRequest = store.getState().replacementRequest;

    // Then
    expect(activeRequest?.slot).toBe("cpu");
    expect(store.getState().replacementQueue).toHaveLength(1);

    // When
    if (activeRequest !== null) {
      store.getState().completeReplacement(activeRequest.requestId);
    }

    // Then
    expect(store.getState().replacementRequest?.slot).toBe("motherboard");
    expect(store.getState().replacementQueue).toHaveLength(0);
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
