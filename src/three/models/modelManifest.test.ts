import { describe, expect, it } from "vitest";
import { parseModelManifest } from "./modelManifest";

const validManifest = {
  assetId: "gpu-nvidia-rtx5090-reference",
  componentType: "gpu",
  url: "/models/gpu_rtx5090.glb",
  fallback: "placeholder",
  transform: {
    position: [0, 1.2, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  },
  installation: {
    entryOffset: [2.4, 0.4, 0],
    durationMs: 1200,
  },
  lod: [],
};

describe("parseModelManifest", () => {
  it("parses a valid local GLB manifest", () => {
    const result = parseModelManifest(validManifest);

    expect(result.assetId).toBe("gpu-nvidia-rtx5090-reference");
    expect(result.componentType).toBe("gpu");
    expect(result.installation.durationMs).toBe(1200);
  });

  it("rejects non-GLB model paths", () => {
    expect(() =>
      parseModelManifest({
        ...validManifest,
        url: "/models/gpu_rtx5090.obj",
      }),
    ).toThrow();
  });

  it("rejects installation durations outside the approved range", () => {
    expect(() =>
      parseModelManifest({
        ...validManifest,
        installation: {
          ...validManifest.installation,
          durationMs: 400,
        },
      }),
    ).toThrow();
  });
});
