import { Group, Mesh } from "three";
import { describe, expect, it } from "vitest";
import { resolveSelection } from "./SelectionSystem";

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
});
