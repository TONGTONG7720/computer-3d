import { describe, expect, it } from "vitest";
import { parseHardwareCatalogue } from "./HardwareApiClient";

const baseHardware = {
  id: "cpu-intel-i9-14900k",
  name: "Intel Core i9-14900K",
  brand: "Intel",
  category: "CPU",
  builderCategory: "cpu",
  price: 3999,
  performance: 96,
  power: 253,
  modelUrl: "/models/cpu_i9_14900k.glb",
  modelVariant: "intel-i9",
};

describe("HardwareApiClient", () => {
  it("maps the hardware platform response into the builder domain", () => {
    const catalogue = parseHardwareCatalogue({
      code: "OK",
      data: {
        total: 2,
        items: [
          {
            ...baseHardware,
            socket: "LGA1700",
            cores: 24,
            threads: 32,
            tdp: 253,
          },
          {
            ...baseHardware,
            id: "case-future-glass",
            name: "Future Glass Case",
            brand: "PC LAB",
            category: "CASE",
            builderCategory: "case",
            price: 1299,
            performance: 94,
            power: 8,
            modelUrl: "/assets/models/future.glb",
            modelVariant: "future-glass",
            gpuMaxLength: 360,
            motherboardSize: ["ATX", "Micro-ATX"],
            radiatorMaxSize: 360,
          },
        ],
      },
    });

    expect(catalogue).toHaveLength(2);
    expect(catalogue[0]).toMatchObject({
      category: "cpu",
      socket: "LGA1700",
      cores: 24,
    });
    expect(catalogue[1]).toMatchObject({
      category: "case",
      modelUrl: "http://127.0.0.1:8088/assets/models/future.glb",
      gpuMaxLength: 360,
    });
  });

  it("rejects malformed category specifications before they reach the store", () => {
    expect(() =>
      parseHardwareCatalogue({
        code: "OK",
        data: {
          total: 1,
          items: [{ ...baseHardware, cores: 24 }],
        },
      }),
    ).toThrow();
  });
});
