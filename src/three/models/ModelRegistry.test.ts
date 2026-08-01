import { describe, expect, it } from "vitest";
import { hardwareByCategory } from "@/features/builder/data/mockHardware";
import { ModelRegistry } from "./ModelRegistry";

describe("ModelRegistry", () => {
  it("maps the demo RTX 5090 to its category-scoped production filename", () => {
    // Given
    const registry = new ModelRegistry();
    const gpu = hardwareByCategory.gpu.find((hardware) => hardware.id.includes("rtx5090"));

    // When
    const descriptor = gpu === undefined ? undefined : registry.resolve(gpu);

    // Then
    expect(descriptor).toMatchObject({
      source: "placeholder",
      url: "/models/gpu/gpu_rtx5090_founder.glb",
      componentType: "gpu",
    });
  });

  it("uses an explicitly registered GLB without changing the hardware record", () => {
    // Given
    const registry = new ModelRegistry();
    const cpu = hardwareByCategory.cpu.find((hardware) => hardware.id.includes("14900k"));

    // When
    if (cpu !== undefined) {
      registry.register({
        assetId: cpu.id,
        componentType: "cpu",
        source: "glb",
        url: "/models/cpu/cpu_i9.glb",
      });
    }
    const descriptor = cpu === undefined ? undefined : registry.resolve(cpu);

    // Then
    expect(descriptor?.source).toBe("glb");
    expect(cpu?.modelUrl).toBe("/models/cpu_i9_14900k.glb");
  });
});
