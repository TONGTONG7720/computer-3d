import { Group } from "three";
import { describe, expect, it, vi } from "vitest";
import { ModelCache } from "./ModelCache";

describe("ModelCache", () => {
  it("clones cached templates and tracks live references", () => {
    const cache = new ModelCache();
    const template = new Group();
    template.name = "GPU_TEMPLATE";
    const dispose = vi.fn();

    cache.store("gpu-rtx5090", template, dispose);
    const first = cache.acquire("gpu-rtx5090");
    const second = cache.acquire("gpu-rtx5090");

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first).not.toBe(second);
    expect(cache.inspect("gpu-rtx5090")).toEqual({
      references: 2,
      status: "ready",
    });

    cache.release("gpu-rtx5090");
    cache.release("gpu-rtx5090");
    expect(cache.inspect("gpu-rtx5090")?.references).toBe(0);

    cache.evict("gpu-rtx5090");
    expect(dispose).toHaveBeenCalledOnce();
    expect(cache.has("gpu-rtx5090")).toBe(false);
  });

  it("does not evict a template while live instances exist", () => {
    const cache = new ModelCache();
    const dispose = vi.fn();

    cache.store("cpu-i9-14900k", new Group(), dispose);
    cache.acquire("cpu-i9-14900k");

    expect(cache.evict("cpu-i9-14900k")).toBe(false);
    expect(dispose).not.toHaveBeenCalled();
  });
});
