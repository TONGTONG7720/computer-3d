import { describe, expect, it } from "vitest";
import { parseHardwareCatalogue } from "./HardwareApiClient";

const baseHardware = {
  id: "cpu-intel-i9-14900k",
  name: "Intel Core i9-14900K",
  brand: "Intel",
  category: "CPU",
  builderCategory: "cpu",
  description: "24 核旗舰处理器",
  price: 3999,
  performance: 96,
  popularity: 94,
  performanceProfile: {
    gaming: 94,
    creator: 100,
    ai: 96,
    source: "PC LAB reviewed index V1",
    version: 1,
  },
  power: 253,
  modelUrl: "/models/cpu_i9_14900k.glb",
  modelVariant: "intel-i9",
  coverUrl: "",
  primaryModel: {
    id: 1,
    name: "Intel Core i9-14900K Primary",
    glbUrl: "/models/cpu_i9_14900k.glb",
    textureUrl: "",
    previewUrl: "",
    scale: { x: 1, y: 1, z: 1 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    animationConfig: '{"durationMs":1200}',
    lodLevel: 0,
    fileSizeBytes: 0,
    checksumSha256: "",
    primary: true,
    status: "READY",
  },
};

describe("HardwareApiClient", () => {
  it("maps the hardware platform response into the builder domain", () => {
    const catalogue = parseHardwareCatalogue({
      code: "OK",
      data: {
        page: 1,
        size: 100,
        total: 2,
        pages: 1,
        items: [
          {
            ...baseHardware,
            socket: "LGA1700",
            cpuGeneration: "Raptor Lake Refresh",
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
      popularity: 94,
      performanceProfile: { creator: 100 },
      primaryModel: { animationConfig: { durationMs: 1200 } },
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
          page: 1,
          size: 100,
          total: 1,
          pages: 1,
          items: [{ ...baseHardware, cores: 24 }],
        },
      }),
    ).toThrow();
  });
});
