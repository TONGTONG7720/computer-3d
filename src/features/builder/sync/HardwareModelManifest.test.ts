import { describe, expect, it } from "vitest";
import { hardwareByCategory } from "../data/mockHardware";
import { createHardwareModelManifest } from "./HardwareModelManifest";

describe("HardwareModelManifest", () => {
  it("converts Builder hardware into a valid scene manifest", () => {
    // Given
    const gpu = hardwareByCategory.gpu[0];

    // When
    const manifest = gpu === undefined ? undefined : createHardwareModelManifest(gpu);

    // Then
    expect(manifest).toMatchObject({
      assetId: gpu?.id,
      componentType: "gpu",
      url: gpu?.modelUrl,
      fallback: "placeholder",
    });
    expect(manifest?.installation.durationMs).toBeGreaterThanOrEqual(800);
  });
});
