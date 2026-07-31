import { describe, expect, it } from "vitest";
import { createBuilderStore } from "@/store/builderStore";
import { createEngineStore } from "@/store/engineStore";
import { defaultSelectedComponents, hardwareByCategory } from "../data/mockHardware";
import {
  applyBuilderSelectionWithScene,
  selectBuilderHardwareWithScene,
} from "./BuilderEngineSync";

describe("BuilderEngineSync", () => {
  it("updates builder state before emitting a scene replacement", () => {
    // Given
    const builder = createBuilderStore();
    const engine = createEngineStore();
    const cpu = hardwareByCategory.cpu[1];

    // When
    if (cpu !== undefined) {
      selectBuilderHardwareWithScene(cpu, { builder, engine });
    }

    // Then
    expect(builder.getState().selectedComponents.cpu?.id).toBe(cpu?.id);
    expect(engine.getState().replacementRequest).toMatchObject({
      slot: "cpu",
      assetId: cpu?.id,
    });
  });

  it("queues every changed part when applying a recommended machine", () => {
    // Given
    const builder = createBuilderStore();
    const engine = createEngineStore();
    const recommendation = {
      ...defaultSelectedComponents,
      cpu: hardwareByCategory.cpu[1] ?? null,
      motherboard: hardwareByCategory.motherboard[1] ?? null,
    };

    // When
    applyBuilderSelectionWithScene(recommendation, { builder, engine });

    // Then
    expect(builder.getState().selectedComponents).toEqual(recommendation);
    expect(engine.getState().replacementRequest?.slot).toBe("cpu");
    expect(engine.getState().replacementQueue.map((command) => command.slot)).toContain(
      "motherboard",
    );
  });
});
