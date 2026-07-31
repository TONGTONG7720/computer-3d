import { describe, expect, it } from "vitest";
import { defaultSelectedComponents } from "../data/mockHardware";
import {
  type BuildStorage,
  createBuildConfig,
  loadBuildConfigs,
  saveBuildConfig,
} from "./BuildStorage";
import { calculatePerformance } from "./PerformanceCalculator";
import { calculateTotalPrice } from "./PriceCalculator";

const createMemoryStorage = (): BuildStorage => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
};

describe("BuildStorage", () => {
  it("saves and restores a named build through the versioned boundary", () => {
    // Given
    const storage = createMemoryStorage();
    const config = createBuildConfig({
      id: "build-test-1",
      name: "我的电竞主机",
      createdAt: "2026-07-31T12:00:00.000Z",
      components: defaultSelectedComponents,
      price: calculateTotalPrice(defaultSelectedComponents),
      performance: calculatePerformance(defaultSelectedComponents),
    });

    // When
    saveBuildConfig(storage, config);
    const restored = loadBuildConfigs(storage);

    // Then
    expect(restored).toHaveLength(1);
    expect(restored[0]).toMatchObject({
      id: "build-test-1",
      name: "我的电竞主机",
      price: config.price,
    });
  });

  it("returns an empty collection when persisted input is malformed", () => {
    // Given
    const storage = createMemoryStorage();
    storage.setItem("pc-lab-builds-v1", "{broken");

    // When
    const restored = loadBuildConfigs(storage);

    // Then
    expect(restored).toEqual([]);
  });
});
