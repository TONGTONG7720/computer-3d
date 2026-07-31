import { describe, expect, it } from "vitest";
import { getExplosionTransform } from "./ExplosionAnimation";

describe("getExplosionTransform", () => {
  it("moves the GPU outward from the motherboard", () => {
    const transform = getExplosionTransform("gpu");

    expect(transform.position[0]).toBeGreaterThan(1);
    expect(transform.position[1]).toBeGreaterThan(0);
  });

  it("raises cooling above the case", () => {
    const transform = getExplosionTransform("cooling");

    expect(transform.position[1]).toBeGreaterThan(1);
  });

  it("keeps the case shell as the assembly reference", () => {
    const transform = getExplosionTransform("case");

    expect(transform.position).toEqual([0, 0, 0]);
    expect(transform.rotation).toEqual([0, 0, 0]);
  });
});
