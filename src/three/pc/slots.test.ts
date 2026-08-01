import { describe, expect, it } from "vitest";
import { componentSlots, getComponentSlot } from "./slots";

describe("PC component slots", () => {
  it("defines every independently replaceable mount when the engine starts", () => {
    // Given
    const expectedSlots = [
      "pc_case",
      "motherboard",
      "cpu_socket",
      "gpu_slot",
      "ram_slots",
      "storage_slots",
      "cooling_mount",
      "fan_mount",
      "psu_area",
    ];

    // When
    const slotIds = componentSlots.map((slot) => slot.slotId);

    // Then
    expect(slotIds).toEqual(expectedSlots);
    expect(new Set(slotIds).size).toBe(expectedSlots.length);
  });

  it("gives the GPU an outward install path and exploded destination", () => {
    // Given
    const slotId = "gpu_slot";

    // When
    const slot = getComponentSlot(slotId);

    // Then
    expect(slot.installEntry[2]).toBeGreaterThan(1);
    expect(slot.explodedOffset[0]).toBeGreaterThan(2);
    expect(slot.componentType).toBe("gpu");
  });
});
