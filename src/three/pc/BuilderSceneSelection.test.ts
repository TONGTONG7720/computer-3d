import { describe, expect, it } from "vitest";
import { defaultSelectedComponents } from "@/features/builder/data/mockHardware";
import { createBuilderSceneSelection } from "./BuilderSceneSelection";

describe("createBuilderSceneSelection", () => {
  it("maps the eight Builder categories to independent PC mounts", () => {
    // Given
    const selectedComponents = defaultSelectedComponents;

    // When
    const scene = createBuilderSceneSelection(selectedComponents);

    // Then
    expect(scene.pc_case?.hardware.category).toBe("case");
    expect(scene.motherboard?.hardware.category).toBe("motherboard");
    expect(scene.cpu_socket?.hardware.category).toBe("cpu");
    expect(scene.gpu_slot?.hardware.category).toBe("gpu");
    expect(scene.ram_slots?.hardware.category).toBe("ram");
    expect(scene.storage_slots?.hardware.category).toBe("storage");
    expect(scene.cooling_mount?.hardware.category).toBe("cooling");
    expect(scene.psu_area?.hardware.category).toBe("power_supply");
  });

  it("resolves the selected RTX 5090 through the production model registry", () => {
    // Given / When
    const scene = createBuilderSceneSelection(defaultSelectedComponents);

    // Then
    expect(scene.gpu_slot?.descriptor).toMatchObject({
      source: "placeholder",
      url: "/models/gpu/gpu_rtx5090_founder.glb",
    });
  });
});
