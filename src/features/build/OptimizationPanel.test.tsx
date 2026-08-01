// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { mockHardware } from "@/features/builder/data/mockHardware";
import { parseHardwareId } from "@/features/builder/domain/hardware";
import type { BuildOptimization } from "@/features/builder/domain/intelligence";
import { BuilderStoreProvider } from "@/features/builder/store/BuilderStoreProvider";
import { createBuilderStore } from "@/store/builderStore";
import { OptimizationPanel } from "./OptimizationPanel";

describe("OptimizationPanel", () => {
  afterEach(() => cleanup());

  it("requires an explicit apply action before changing the build", async () => {
    const store = createBuilderStore({
      initialCatalogue: mockHardware,
      optimizationLoader: async (input) => optimizationFixture(input.revision),
    });
    const originalStorage = store.getState().selectedComponents.storage?.id;
    render(
      <BuilderStoreProvider store={store}>
        <OptimizationPanel />
      </BuilderStoreProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "生成优化方案" }));
    expect(await screen.findByText("降低 storage 成本")).toBeTruthy();
    expect(store.getState().selectedComponents.storage?.id).toBe(originalStorage);

    fireEvent.click(screen.getByRole("button", { name: "应用优化" }));
    await waitFor(() => {
      expect(store.getState().selectedComponents.storage?.id).toBe("storage-nvme-1tb");
    });
  });
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
  projectedAnalysis: {
    revision,
    components: {
      cpu: parseHardwareId("cpu-intel-i9-14900k"),
      gpu: parseHardwareId("gpu-nvidia-rtx5090"),
      motherboard: parseHardwareId("motherboard-z790-lab"),
      ram: parseHardwareId("ram-ddr5-64gb"),
      storage: parseHardwareId("storage-nvme-1tb"),
      cooling: parseHardwareId("cooling-aio-360"),
      power_supply: parseHardwareId("psu-1200w-platinum"),
      case: parseHardwareId("case-future-glass"),
    },
    totalPrice: 12500,
    systemPowerWatt: 900,
    priceSource: "PC_LAB_INTERNAL_REFERENCE",
    compatibility: {
      status: "SUCCESS",
      issues: [],
      checkedRuleCount: 8,
      systemPowerWatt: 900,
      recommendedPsuWatt: 1200,
      missingCategories: [],
    },
    performance: {
      gaming: { score: 98, contributions: [] },
      creator: { score: 96, contributions: [] },
      ai: { score: 99, contributions: [] },
      overall: 98,
      complete: true,
    },
    budget: {
      status: "WITHIN",
      limit: 13000,
      current: 12500,
      remaining: 500,
      overage: 0,
      utilizationPercent: 96.15,
    },
  },
  suggestions: [
    {
      code: "BUDGET_REBALANCE",
      title: "降低 storage 成本",
      reason: "释放预算并保留游戏性能",
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
