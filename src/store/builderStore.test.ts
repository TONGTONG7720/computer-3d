import { describe, expect, it } from "vitest";
import { hardwareByCategory, mockHardware } from "@/features/builder/data/mockHardware";
import { createBuilderStore } from "./builderStore";

describe("builderStore", () => {
  it("recalculates price, performance and compatibility after a hardware selection", () => {
    // Given
    const store = createBuilderStore({ initialCatalogue: mockHardware });
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
    const store = createBuilderStore({ initialCatalogue: mockHardware });
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

  it("loads the backend catalogue and applies stable defaults", async () => {
    const store = createBuilderStore({
      catalogueLoader: async () => mockHardware,
    });

    await store.getState().initializeCatalogue();

    expect(store.getState().catalogueStatus).toBe("ready");
    expect(store.getState().catalogue).toHaveLength(mockHardware.length);
    expect(store.getState().selectedComponents.gpu?.id).toBe("gpu-nvidia-rtx5090");
    expect(store.getState().totalPrice).toBeGreaterThan(0);
  });

  it("surfaces a retryable state when the backend request fails", async () => {
    const store = createBuilderStore({
      catalogueLoader: async () => {
        throw new Error("offline");
      },
    });

    await store.getState().initializeCatalogue();

    expect(store.getState().catalogueStatus).toBe("error");
    expect(store.getState().catalogueError).toContain("8088");
  });
});
