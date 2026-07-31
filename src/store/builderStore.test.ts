import { describe, expect, it } from "vitest";
import { hardwareByCategory } from "@/features/builder/data/mockHardware";
import { createBuilderStore } from "./builderStore";

describe("builderStore", () => {
  it("recalculates price, performance and compatibility after a hardware selection", () => {
    // Given
    const store = createBuilderStore();
    const before = store.getState();
    const amdCpu = hardwareByCategory.cpu[1];

    // When
    if (amdCpu !== undefined) {
      store.getState().selectHardware(amdCpu);
    }
    const after = store.getState();

    // Then
    expect(after.selectedComponents.cpu?.id).toBe(amdCpu?.id);
    expect(after.totalPrice).not.toBe(before.totalPrice);
    expect(after.performanceScore).not.toEqual(before.performanceScore);
    expect(after.compatibilityStatus.status).toBe("error");
    expect(after.feedback.revision).toBe(1);
  });

  it("applies a complete recommended selection in one revision", () => {
    // Given
    const store = createBuilderStore();
    const selection = {
      ...store.getState().selectedComponents,
      cpu: hardwareByCategory.cpu[1] ?? null,
      motherboard: hardwareByCategory.motherboard[1] ?? null,
    };

    // When
    store.getState().applySelection(selection);

    // Then
    expect(store.getState().selectedComponents.cpu?.brand).toBe("AMD");
    expect(store.getState().compatibilityStatus.status).not.toBe("error");
    expect(store.getState().feedback.revision).toBe(1);
  });
});
