import { describe, expect, it } from "vitest";
import { SelectionManager } from "./SelectionManager";

describe("SelectionManager", () => {
  it("emits only real semantic selection changes", () => {
    // Given
    const changes: (string | null)[] = [];
    const manager = new SelectionManager((selection) => changes.push(selection));

    // When
    manager.select("gpu_slot");
    manager.select("gpu_slot");
    manager.clear();

    // Then
    expect(changes).toEqual(["gpu_slot", null]);
  });
});
