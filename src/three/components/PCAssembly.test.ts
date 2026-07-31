import { describe, expect, it } from "vitest";
import { createDemoAssembly } from "./PCAssembly";

describe("createDemoAssembly", () => {
  it("creates every independently managed PC component", () => {
    const assembly = createDemoAssembly();
    const slots = assembly.map((component) => component.slot);

    expect(slots).toEqual([
      "case",
      "motherboard",
      "cpu",
      "gpu",
      "ram",
      "storage",
      "cooling",
      "fan",
      "power_supply",
    ]);
    expect(new Set(assembly.map((component) => component.object)).size).toBe(9);
  });

  it("creates a selectable GPU with three independent fan meshes", () => {
    const assembly = createDemoAssembly();
    const gpu = assembly.find((component) => component.slot === "gpu");

    expect(gpu).toBeDefined();
    expect(gpu?.object.name).toBe("CMP_GPU");
    expect(gpu?.object.getObjectByName("GEO_GPU_FAN_01")).toBeDefined();
    expect(gpu?.object.getObjectByName("GEO_GPU_FAN_02")).toBeDefined();
    expect(gpu?.object.getObjectByName("GEO_GPU_FAN_03")).toBeDefined();
  });
});
