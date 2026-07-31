import { Group, Scene } from "three";
import { describe, expect, it } from "vitest";
import { SceneManager } from "./SceneManager";

describe("SceneManager", () => {
  it("registers independent components under a stable PC root", () => {
    const scene = new Scene();
    const manager = new SceneManager();
    manager.mount(scene);
    const gpu = new Group();

    manager.register({
      slot: "gpu",
      assetId: "gpu-rtx5090",
      object: gpu,
    });

    expect(scene.getObjectByName("GRP_PC_ROOT")).toBe(manager.root);
    expect(manager.get("gpu")?.object).toBe(gpu);
    expect(gpu.parent).toBe(manager.root);
  });

  it("atomically replaces a slot and returns the previous component", () => {
    const manager = new SceneManager();
    manager.mount(new Scene());
    const oldGpu = new Group();
    const newGpu = new Group();
    manager.register({
      slot: "gpu",
      assetId: "gpu-old",
      object: oldGpu,
    });

    const previous = manager.replace({
      slot: "gpu",
      assetId: "gpu-new",
      object: newGpu,
    });

    expect(previous?.object).toBe(oldGpu);
    expect(oldGpu.parent).toBeNull();
    expect(newGpu.parent).toBe(manager.root);
    expect(manager.get("gpu")?.assetId).toBe("gpu-new");
  });
});
