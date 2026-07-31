import { Group } from "three";
import { describe, expect, it, vi } from "vitest";
import {
  ComponentReplacementManager,
  type ReplacementDependencies,
} from "./ComponentReplacementManager";

const createDependencies = (): ReplacementDependencies => ({
  acquireCached: vi.fn(() => new Group()),
  load: vi.fn(async () => new Group()),
  removeCurrent: vi.fn(async () => undefined),
  install: vi.fn(async () => undefined),
  commit: vi.fn(async () => undefined),
  rollback: vi.fn(async () => undefined),
  releaseCurrent: vi.fn(),
});

describe("ComponentReplacementManager", () => {
  it("uses a cached model and commits only after installation", async () => {
    const dependencies = createDependencies();
    const phases: string[] = [];
    const manager = new ComponentReplacementManager(dependencies, (state) => {
      phases.push(state.phase);
    });

    const result = await manager.replace({
      slot: "gpu",
      assetId: "gpu-rtx5090",
      modelUrl: "/models/gpu_rtx5090.glb",
    });

    expect(result.kind).toBe("success");
    expect(dependencies.load).not.toHaveBeenCalled();
    expect(dependencies.removeCurrent).toHaveBeenCalledOnce();
    expect(dependencies.install).toHaveBeenCalledOnce();
    expect(dependencies.commit).toHaveBeenCalledOnce();
    expect(phases).toEqual(["preparing", "removing", "installing", "locked", "idle"]);
  });

  it("loads a cache miss before removing the current component", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.acquireCached).mockReturnValue(undefined);
    const calls: string[] = [];
    vi.mocked(dependencies.load).mockImplementation(async () => {
      calls.push("load");
      return new Group();
    });
    vi.mocked(dependencies.removeCurrent).mockImplementation(async () => {
      calls.push("remove");
    });
    const manager = new ComponentReplacementManager(dependencies);

    await manager.replace({
      slot: "cpu",
      assetId: "cpu-i9-14900k",
      modelUrl: "/models/cpu_i9_14900k.glb",
    });

    expect(calls).toEqual(["load", "remove"]);
  });

  it("supports every typed scene component slot", async () => {
    // Given
    const dependencies = createDependencies();
    const manager = new ComponentReplacementManager(dependencies);

    // When
    const result = await manager.replace({
      slot: "ram",
      assetId: "ram-ddr5-64gb",
      modelUrl: "/models/ram_ddr5_64gb.glb",
    });

    // Then
    expect(result.kind).toBe("success");
    expect(dependencies.install).toHaveBeenCalledWith("ram", expect.any(Group));
  });

  it("preserves the current component when loading fails", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.acquireCached).mockReturnValue(undefined);
    vi.mocked(dependencies.load).mockRejectedValue(new Error("network unavailable"));
    const manager = new ComponentReplacementManager(dependencies);

    const result = await manager.replace({
      slot: "gpu",
      assetId: "gpu-rtx5090",
      modelUrl: "/models/gpu_rtx5090.glb",
    });

    expect(result.kind).toBe("failure");
    expect(dependencies.removeCurrent).not.toHaveBeenCalled();
    expect(dependencies.commit).not.toHaveBeenCalled();
  });

  it("rolls back the current component when installation fails", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.install).mockRejectedValue(new Error("animation interrupted"));
    const manager = new ComponentReplacementManager(dependencies);

    const result = await manager.replace({
      slot: "gpu",
      assetId: "gpu-rtx5090-aurora",
      modelUrl: "/models/gpu_rtx5090_aurora.glb",
    });

    expect(result.kind).toBe("failure");
    expect(dependencies.rollback).toHaveBeenCalledOnce();
    expect(dependencies.commit).not.toHaveBeenCalled();
  });
});
