import { describe, expect, it } from "vitest";
import { parseBuildAnalysis, parseBuildOptimization } from "./BuildIntelligenceApiClient";

const analysisData = {
  revision: 12,
  components: {
    cpu: "cpu-test",
    gpu: "gpu-test",
    motherboard: "motherboard-test",
    ram: "ram-test",
    storage: "storage-test",
    cooling: "cooling-test",
    power_supply: "psu-test",
    case: "case-test",
  },
  totalPrice: 8000,
  systemPowerWatt: 564,
  priceSource: "PC_LAB_INTERNAL_REFERENCE",
  compatibility: {
    status: "SUCCESS",
    issues: [],
    checkedRuleCount: 8,
    systemPowerWatt: 564,
    recommendedPsuWatt: 800,
    missingCategories: [],
  },
  performance: {
    gaming: { score: 92, contributions: [] },
    creator: { score: 88, contributions: [] },
    ai: { score: 92, contributions: [] },
    overall: 91,
    complete: true,
  },
  budget: {
    status: "WITHIN",
    limit: 10000,
    current: 8000,
    remaining: 2000,
    overage: 0,
    utilizationPercent: 80,
  },
};

describe("BuildIntelligenceApiClient", () => {
  it("parses the authoritative analysis contract", () => {
    const analysis = parseBuildAnalysis({ code: "OK", data: analysisData });

    expect(analysis.revision).toBe(12);
    expect(analysis.compatibility.checkedRuleCount).toBe(8);
    expect(analysis.performance.creator.score).toBe(88);
    expect(analysis.budget.remaining).toBe(2000);
  });

  it("parses an explicit optimization proposal", () => {
    const optimization = parseBuildOptimization({
      code: "OK",
      data: {
        revision: 12,
        goal: "gaming",
        recommendedComponents: analysisData.components,
        projectedAnalysis: analysisData,
        suggestions: [
          {
            code: "BUDGET_REBALANCE",
            title: "降低 storage 成本",
            reason: "释放预算",
            changes: { storage: "storage-value" },
            priceDelta: -600,
            profileDelta: -1,
            applicable: true,
          },
        ],
        priceDelta: -600,
        profileDelta: -1,
        unresolvedBudget: 0,
        changed: true,
        reason: "已生成 1 项可应用优化",
      },
    });

    expect(optimization.goal).toBe("gaming");
    expect(optimization.suggestions[0]?.changes.storage).toBe("storage-value");
  });

  it("rejects a malformed stale-response guard revision", () => {
    expect(() =>
      parseBuildAnalysis({
        code: "OK",
        data: { ...analysisData, revision: -1 },
      }),
    ).toThrow();
  });
});
