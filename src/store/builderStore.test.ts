import { describe, expect, it } from "vitest";
import { hardwareByCategory, mockHardware } from "@/features/builder/data/mockHardware";
import { parseHardwareId } from "@/features/builder/domain/hardware";
import type { BuildAnalysis, BuildOptimization } from "@/features/builder/domain/intelligence";
import { createBuilderStore } from "./builderStore";

describe("builderStore", () => {
  it("recalculates price, performance and compatibility after a hardware selection", () => {
    // Given
    const store = createBuilderStore({ initialCatalogue: mockHardware });
    const before = store.getState();
    const amdCpu = hardwareByCategory.cpu[1];

    // When
    if (amdCpu !== undefined) {
      store.getState().selectHardware(amdCpu);
    }
    const after = store.getState();

    // Then
    expect(after.selectedComponents.cpu?.id).toBe(amdCpu?.id);
    expect(after.totalPrice).not.toBe(before.totalPrice);
    expect(after.performanceScore).not.toEqual(before.performanceScore);
    expect(after.compatibilityStatus.status).toBe("error");
    expect(after.feedback.revision).toBe(1);
  });

  it("applies a complete recommended selection in one revision", () => {
    // Given
    const store = createBuilderStore({ initialCatalogue: mockHardware });
    const selection = {
      ...store.getState().selectedComponents,
      cpu: hardwareByCategory.cpu[1] ?? null,
      motherboard: hardwareByCategory.motherboard[1] ?? null,
    };

    // When
    store.getState().applySelection(selection);

    // Then
    expect(store.getState().selectedComponents.cpu?.brand).toBe("AMD");
    expect(store.getState().compatibilityStatus.status).not.toBe("error");
    expect(store.getState().feedback.revision).toBe(1);
  });

  it("loads the backend catalogue and applies stable defaults", async () => {
    const store = createBuilderStore({
      catalogueLoader: async () => mockHardware,
    });

    await store.getState().initializeCatalogue();

    expect(store.getState().catalogueStatus).toBe("ready");
    expect(store.getState().catalogue).toHaveLength(mockHardware.length);
    expect(store.getState().selectedComponents.gpu?.id).toBe("gpu-nvidia-rtx5090");
    expect(store.getState().totalPrice).toBeGreaterThan(0);
  });

  it("surfaces a retryable state when the backend request fails", async () => {
    const store = createBuilderStore({
      catalogueLoader: async () => {
        throw new Error("offline");
      },
    });

    await store.getState().initializeCatalogue();

    expect(store.getState().catalogueStatus).toBe("error");
    expect(store.getState().catalogueError).toContain("8088");
  });

  it("rejects an authoritative analysis when its revision is stale", () => {
    const store = createBuilderStore({ initialCatalogue: mockHardware });
    const initialRevision = store.getState().feedback.revision;
    const amdCpu = hardwareByCategory.cpu[1];
    if (amdCpu !== undefined) {
      store.getState().selectHardware(amdCpu);
    }

    const accepted = store
      .getState()
      .applyAuthoritativeAnalysis(analysisFixture(initialRevision, 1234));

    expect(accepted).toBe(false);
    expect(store.getState().totalPrice).not.toBe(1234);
    expect(store.getState().analysisRevision).toBeNull();
  });

  it("applies only the analysis matching the latest builder revision", () => {
    const store = createBuilderStore({ initialCatalogue: mockHardware });
    const revision = store.getState().feedback.revision;

    const accepted = store.getState().applyAuthoritativeAnalysis(analysisFixture(revision, 1234));

    expect(accepted).toBe(true);
    expect(store.getState().totalPrice).toBe(1234);
    expect(store.getState().performanceScore.production).toBe(88);
    expect(store.getState().analysisStatus).toBe("ready");
    expect(store.getState().analysisRevision).toBe(revision);
  });

  it("keeps optimization as a proposal until the user applies it", async () => {
    const base = createBuilderStore({ initialCatalogue: mockHardware });
    const proposal = optimizationFixture(base.getState().feedback.revision);
    const store = createBuilderStore({
      initialCatalogue: mockHardware,
      optimizationLoader: async () => proposal,
    });
    const originalStorage = store.getState().selectedComponents.storage?.id;

    await store.getState().requestOptimization("gaming");

    expect(store.getState().optimization?.changed).toBe(true);
    expect(store.getState().selectedComponents.storage?.id).toBe(originalStorage);
    expect(store.getState().applyOptimization()).toBe(true);
    expect(store.getState().selectedComponents.storage?.id).toBe("storage-nvme-1tb");
  });
});

const analysisFixture = (revision: number, totalPrice: number): BuildAnalysis => ({
  revision,
  components: {
    cpu: parseHardwareId("cpu-test"),
    gpu: parseHardwareId("gpu-test"),
    motherboard: parseHardwareId("motherboard-test"),
    ram: parseHardwareId("ram-test"),
    storage: parseHardwareId("storage-test"),
    cooling: parseHardwareId("cooling-test"),
    power_supply: parseHardwareId("psu-test"),
    case: parseHardwareId("case-test"),
  },
  totalPrice,
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
    limit: 30000,
    current: totalPrice,
    remaining: 30000 - totalPrice,
    overage: 0,
    utilizationPercent: 4.11,
  },
});

const optimizationFixture = (revision: number): BuildOptimization => ({
  revision,
  goal: "gaming",
  recommendedComponents: {
    cpu: parseHardwareId("cpu-intel-i9-14900k"),
    gpu: parseHardwareId("gpu-nvidia-rtx5090"),
    motherboard: parseHardwareId("motherboard-z790-lab"),
    ram: parseHardwareId("ram-ddr5-64gb"),
    storage: parseHardwareId("storage-nvme-1tb"),
    cooling: parseHardwareId("cooling-aio-360"),
    power_supply: parseHardwareId("psu-1200w-platinum"),
    case: parseHardwareId("case-future-glass"),
  },
  projectedAnalysis: analysisFixture(revision, 12500),
  suggestions: [
    {
      code: "BUDGET_REBALANCE",
      title: "降低 storage 成本",
      reason: "释放预算",
      changes: { storage: parseHardwareId("storage-nvme-1tb") },
      priceDelta: -1200,
      profileDelta: -1,
      applicable: true,
    },
  ],
  priceDelta: -1200,
  profileDelta: -1,
  unresolvedBudget: 0,
  changed: true,
  reason: "已生成 1 项可应用优化",
});
