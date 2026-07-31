import { Color } from "three";
import { describe, expect, it } from "vitest";
import {
  createGlassMaterial,
  createMetalMaterial,
  createPcbMaterial,
  createRgbMaterial,
  materialTokens,
} from "./MaterialSystem";

describe("MaterialSystem", () => {
  it("creates machined metal with a controlled roughness range", () => {
    const material = createMetalMaterial(materialTokens.graphiteMetal);

    expect(material.metalness).toBeGreaterThanOrEqual(0.8);
    expect(material.roughness).toBeGreaterThan(0.1);
    expect(material.roughness).toBeLessThan(0.5);
  });

  it("creates transparent physical glass", () => {
    const material = createGlassMaterial();

    expect(material.transparent).toBe(true);
    expect(material.transmission).toBeGreaterThan(0.5);
    expect(material.opacity).toBeLessThan(0.5);
  });

  it("creates a green PCB material and emissive RGB material", () => {
    const pcb = createPcbMaterial();
    const rgb = createRgbMaterial(materialTokens.cyan);

    expect(pcb.color.getHex()).toBe(new Color(materialTokens.pcbGreen).getHex());
    expect(rgb.emissive.getHex()).toBe(new Color(materialTokens.cyan).getHex());
    expect(rgb.emissiveIntensity).toBeGreaterThan(1);
  });
});
