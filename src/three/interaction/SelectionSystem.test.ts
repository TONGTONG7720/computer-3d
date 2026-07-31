import { Group, Mesh, MeshStandardMaterial } from "three";
import { describe, expect, it } from "vitest";
import { resolveSelection, SelectionSystem } from "./SelectionSystem";

describe("resolveSelection", () => {
  it("walks from a child mesh to its component root", () => {
    const gpu = new Group();
    gpu.name = "CMP_GPU";
    const shroud = new Mesh();
    shroud.name = "GEO_GPU_SHROUD";
    gpu.add(shroud);

    expect(resolveSelection(shroud)).toEqual({
      componentType: "gpu",
      root: gpu,
    });
  });

  it("ignores objects outside the component hierarchy", () => {
    const environment = new Group();
    environment.name = "GRP_ENVIRONMENT";

    expect(resolveSelection(environment)).toBeUndefined();
  });

  it("restores the original material after selection is cleared", () => {
    const material = new MeshStandardMaterial({
      emissive: 0x101010,
      emissiveIntensity: 0.2,
    });
    const gpu = new Group();
    gpu.name = "CMP_GPU";
    gpu.add(new Mesh(undefined, material));
    const system = new SelectionSystem();

    system.select(gpu);
    expect(material.emissiveIntensity).toBeGreaterThan(0.2);

    system.clear();
    expect(material.emissive.getHex()).toBe(0x101010);
    expect(material.emissiveIntensity).toBe(0.2);
  });
});
