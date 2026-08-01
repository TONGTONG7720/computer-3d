import { Color } from "three";
import { describe, expect, it } from "vitest";
import { createGlassMaterial } from "./GlassMaterial";
import { createMetalMaterial, createPcbMaterial } from "./MetalMaterial";
import { materialTokens } from "./materialTokens";
import { createRgbMaterial } from "./RGBMaterial";

describe("production material modules", () => {
  it("keeps physical glass transparent and out of the depth buffer", () => {
    // Given / When
    const glass = createGlassMaterial();

    // Then
    expect(glass.transmission).toBeGreaterThan(0.7);
    expect(glass.depthWrite).toBe(false);
  });

  it("separates machined metal, PCB, and RGB material roles", () => {
    // Given / When
    const metal = createMetalMaterial();
    const pcb = createPcbMaterial();
    const rgb = createRgbMaterial(materialTokens.cyan);

    // Then
    expect(metal.metalness).toBeGreaterThan(0.8);
    expect(pcb.color.getHex()).toBe(new Color(materialTokens.pcbGreen).getHex());
    expect(rgb.toneMapped).toBe(false);
  });

  it("defines restrained warm fill and cold rim colors for the lab stage", () => {
    // Given / When / Then
    expect(materialTokens.warmWhite).toBe(0xffe5c4);
    expect(materialTokens.coldBlue).toBe(0x69b8ff);
  });
});
