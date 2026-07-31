import { describe, expect, it } from "vitest";
import { defaultSelectedComponents } from "../data/mockHardware";
import { emptySelectedComponents } from "../domain/hardware";
import { createSaveBuildPayload, IncompleteBuildError } from "./BuildApiClient";

describe("BuildApiClient", () => {
  it("creates the backend component-id contract", () => {
    const payload = createSaveBuildPayload("  我的电竞主机  ", defaultSelectedComponents);

    expect(payload.name).toBe("我的电竞主机");
    expect(payload.components.gpu).toBe("gpu-nvidia-rtx5090");
    expect(Object.keys(payload.components)).toHaveLength(8);
  });

  it("rejects incomplete builds before making a request", () => {
    expect(() => createSaveBuildPayload("Incomplete", emptySelectedComponents())).toThrow(
      IncompleteBuildError,
    );
  });
});
