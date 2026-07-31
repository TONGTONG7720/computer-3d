import { describe, expect, it } from "vitest";
import { parseAiBuildResponse } from "./AiBuilderApiClient";

const validPayload = {
  code: "OK",
  message: "success",
  data: {
    requestId: "8d47c31f-4b7d-4c64-a1f2-86927f3d905a",
    sessionId: "665bce9e-34d5-42fd-a6ca-d2d3e12c45f5",
    route: "RULE",
    requirement: {
      budget: 8000,
      purposes: ["GAMING"],
      priorities: ["GPU"],
      styles: [],
      formFactor: "ANY",
      requestedChanges: {},
      missingInformation: [],
    },
    configId: "build-public-id",
    components: {
      cpu: "cpu-amd-7800x3d",
      gpu: "gpu-nvidia-rtx5070",
      motherboard: "motherboard-b650-lab",
      ram: "ram-ddr5-32gb",
      storage: "storage-nvme-1tb",
      cooling: "cooling-aio-240",
      power_supply: "psu-850w-gold",
      case: "case-future-glass",
    },
    totalPrice: 7999,
    performanceScore: 82,
    powerUsageWatt: 520,
    compatibilityStatus: "SUCCESS",
    requiresConfirmation: false,
    assistantMessage: "配置已通过规则计算。",
    componentReasons: { gpu: "游戏用途优先 GPU" },
    changedDependencies: [],
    alternatives: [],
    knowledgeSources: [
      {
        sourceKey: "WORKLOAD_GAMING_V1",
        title: "游戏装机预算分配",
        score: 0.95,
        revision: 1,
      },
    ],
    unfulfilledPreferences: [],
  },
  traceId: "trace-ai",
  timestamp: "2026-08-01T03:00:00Z",
};

describe("AiBuilderApiClient", () => {
  it("parses an explainable build response", () => {
    const result = parseAiBuildResponse(validPayload);

    expect(result.components.gpu).toBe("gpu-nvidia-rtx5070");
    expect(result.knowledgeSources[0]?.sourceKey).toBe("WORKLOAD_GAMING_V1");
    expect(result.requiresConfirmation).toBe(false);
  });

  it("rejects URL-bearing model output", () => {
    expect(() =>
      parseAiBuildResponse({
        ...validPayload,
        data: {
          ...validPayload.data,
          purchaseUrl: "https://untrusted.example/item",
        },
      }),
    ).toThrow();
  });

  it("rejects incomplete component proposals", () => {
    const { case: _removed, ...incomplete } = validPayload.data.components;
    expect(() =>
      parseAiBuildResponse({
        ...validPayload,
        data: { ...validPayload.data, components: incomplete },
      }),
    ).toThrow();
  });

  it("normalizes an omitted optional budget to null", () => {
    const { budget: _budget, ...requirement } = validPayload.data.requirement;
    const result = parseAiBuildResponse({
      ...validPayload,
      data: { ...validPayload.data, requirement },
    });

    expect(result.requirement.budget).toBeNull();
  });
});
