import { Group, Mesh } from "three";
import { describe, expect, it } from "vitest";
import { resolveRaycastSlot } from "./Raycaster";

describe("resolveRaycastSlot", () => {
  it("resolves the closest selectable parent from a child mesh hit", () => {
    // Given
    const gpu = new Group();
    gpu.userData["slotId"] = "gpu_slot";
    const shroud = new Mesh();
    gpu.add(shroud);
    const caseGlass = new Mesh();

    // When
    const selected = resolveRaycastSlot([
      { distance: 3, object: caseGlass },
      { distance: 1, object: shroud },
    ]);

    // Then
    expect(selected).toBe("gpu_slot");
  });

  it("ignores unknown slot metadata", () => {
    // Given
    const object = new Group();
    object.userData["slotId"] = "not-a-pc-slot";

    // When
    const selected = resolveRaycastSlot([{ distance: 1, object }]);

    // Then
    expect(selected).toBeUndefined();
  });
});
