import { Group } from "three";
import { describe, expect, it } from "vitest";
import { normalizeProceduralPart } from "./PartGroup";

describe("normalizeProceduralPart", () => {
  it("moves authored world placement back to the slot-local origin", () => {
    // Given
    const part = new Group();
    part.position.set(1, 2, 3);
    part.rotation.set(0.1, 0.2, 0.3);

    // When
    const normalized = normalizeProceduralPart(part);

    // Then
    expect(normalized).toBe(part);
    expect(normalized.position.toArray()).toEqual([0, 0, 0]);
    expect(normalized.rotation.toArray().slice(0, 3)).toEqual([0, 0, 0]);
  });
});
