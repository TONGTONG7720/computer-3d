// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSelectedComponents, mockHardware } from "@/features/builder/data/mockHardware";
import { hardwareCategories } from "@/features/builder/domain/hardware";
import { builderStore } from "@/store/builderStore";
import { engineStore } from "@/store/engineStore";
import { requestAiBuild } from "../api/AiBuilderApiClient";
import type { AiBuild } from "../domain/aiBuild";
import { AiAssistant } from "./AiAssistant";

vi.mock("../api/AiBuilderApiClient", async (importOriginal) => {
  const original = await importOriginal<typeof import("../api/AiBuilderApiClient")>();
  return { ...original, requestAiBuild: vi.fn() };
});

const proposal: AiBuild = {
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
  configId: "build-1",
  components: {
    cpu: "cpu-amd-7800x3d",
    gpu: "gpu-nvidia-rtx5070",
    motherboard: "motherboard-b650-lab",
    ram: "ram-ddr5-32gb",
    storage: "storage-nvme-1tb",
    cooling: "cooling-tower-160",
    power_supply: "psu-1200w-platinum",
    case: "case-compact-lab",
  },
  totalPrice: 7992,
  budgetShortfall: 0,
  performanceScore: 76,
  powerUsageWatt: 443,
  compatibilityStatus: "SUCCESS",
  requiresConfirmation: true,
  assistantMessage: "已找到兼容方案，应用前请确认整套调整。",
  componentReasons: { gpu: "3A 游戏优先 GPU" },
  changedDependencies: [
    {
      category: "power_supply",
      previousHardwareId: "psu-1200w-platinum",
      selectedHardwareId: "psu-850w-gold",
    },
  ],
  alternatives: [],
  knowledgeSources: [
    {
      sourceKey: "WORKLOAD_GAMING_V1",
      title: "游戏装机预算分配",
      score: 1,
      revision: 1,
    },
    {
      sourceKey: "COMPAT_SOCKET_V1",
      title: "CPU 与主板插槽规则",
      score: 0.96,
      revision: 1,
    },
    {
      sourceKey: "POWER_HEADROOM_V1",
      title: "整机功耗与电源余量",
      score: 0.93,
      revision: 1,
    },
  ],
  unfulfilledPreferences: [],
};

describe("AiAssistant", () => {
  beforeEach(() => {
    vi.mocked(requestAiBuild).mockReset();
    vi.mocked(requestAiBuild).mockResolvedValue(proposal);
    builderStore.setState({
      catalogue: mockHardware,
      catalogueStatus: "ready",
      selectedComponents: defaultSelectedComponents,
    });
    engineStore.setState({ replacementRequest: null, replacementQueue: [] });
  });

  it("shows the explicit shortfall when no compatible build fits the budget", async () => {
    vi.mocked(requestAiBuild).mockResolvedValue({
      ...proposal,
      budgetShortfall: 1400,
      requiresConfirmation: true,
    });
    render(<AiAssistant />);

    fireEvent.click(screen.getByRole("button", { name: "打开 AI 装机顾问" }));
    fireEvent.click(screen.getByRole("button", { name: "8000 游戏主机" }));
    fireEvent.click(screen.getByRole("button", { name: "生成配置" }));

    expect(await screen.findByText("预算缺口 ¥1,400")).toBeTruthy();
  });

  afterEach(() => cleanup());

  it("generates an explainable proposal and applies it through the 3D replacement queue", async () => {
    render(<AiAssistant />);

    fireEvent.click(screen.getByRole("button", { name: "打开 AI 装机顾问" }));
    fireEvent.click(screen.getByRole("button", { name: "8000 游戏主机" }));
    fireEvent.click(screen.getByRole("button", { name: "生成配置" }));

    expect(await screen.findByText("已找到兼容方案，应用前请确认整套调整。")).toBeTruthy();
    expect(screen.getByText("游戏装机预算分配")).toBeTruthy();
    expect(screen.getByText("CPU 与主板插槽规则")).toBeTruthy();
    expect(screen.getByText("整机功耗与电源余量")).toBeTruthy();
    expect(screen.getByText("RTX 5070", { exact: false })).toBeTruthy();
    expect(screen.getByText("¥7,992")).toBeTruthy();
    expect(screen.getByText("76")).toBeTruthy();
    expect(screen.getByText("443W")).toBeTruthy();
    expect(screen.getByText("SUCCESS")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "应用整套调整" }));

    await waitFor(() => {
      const builder = builderStore.getState();
      expect(
        Object.fromEntries(
          hardwareCategories.map((category) => [
            category,
            builder.selectedComponents[category]?.id,
          ]),
        ),
      ).toEqual(proposal.components);
      expect(builder.totalPrice).toBe(7992);
      expect(builder.powerUsage).toBe(443);
      expect(builder.performanceScore.overall).toBe(76);
      expect(builder.compatibilityStatus.status).toBe("success");
      expect(engineStore.getState().replacementRequest).not.toBeNull();
    });
    const engine = engineStore.getState();
    const installationQueue = [engine.replacementRequest, ...engine.replacementQueue].filter(
      (command) => command !== null,
    );
    expect(installationQueue.map((command) => command.slot)).toEqual([
      "cpu",
      "gpu",
      "motherboard",
      "ram",
      "storage",
      "cooling",
      "case",
    ]);
    expect(screen.getByText("配置已送入 3D 安装队列")).toBeTruthy();
  });
});
