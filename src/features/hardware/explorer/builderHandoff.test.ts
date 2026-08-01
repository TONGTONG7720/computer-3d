import { describe, expect, it } from "vitest";
import { parseHardwareId } from "@/features/builder/domain/hardware";
import { consumeBuilderHardware, queueBuilderHardware } from "./builderHandoff";

const storage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => data.set(key, value),
  };
};

describe("Builder hardware handoff", () => {
  it("consumes the selected hardware exactly once", () => {
    const session = storage();
    queueBuilderHardware(parseHardwareId("gpu-nvidia-rtx5090"), session);

    expect(consumeBuilderHardware(session)).toBe("gpu-nvidia-rtx5090");
    expect(consumeBuilderHardware(session)).toBeNull();
  });
});
