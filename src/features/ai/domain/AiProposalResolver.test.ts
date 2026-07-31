import { describe, expect, it } from "vitest";
import { defaultSelectedComponents, mockHardware } from "@/features/builder/data/mockHardware";
import { toSelectedComponentIds } from "@/features/builder/domain/hardware";
import { resolveAiProposal } from "./AiProposalResolver";
import type { AiComponentIds } from "./aiBuild";

describe("AiProposalResolver", () => {
  it("resolves every server key against the live catalogue", () => {
    const ids = toSelectedComponentIds(defaultSelectedComponents);
    const required = (id: string | null, category: string): string => {
      if (id === null) {
        throw new Error(`Fixture missing ${category}`);
      }
      return id;
    };
    const completeIds: AiComponentIds = {
      cpu: required(ids.cpu, "cpu"),
      gpu: required(ids.gpu, "gpu"),
      motherboard: required(ids.motherboard, "motherboard"),
      ram: required(ids.ram, "ram"),
      storage: required(ids.storage, "storage"),
      cooling: required(ids.cooling, "cooling"),
      power_supply: required(ids.power_supply, "power_supply"),
      case: required(ids.case, "case"),
    };

    const result = resolveAiProposal(completeIds, mockHardware);

    expect(result.gpu?.name).toContain("RTX 5090");
    expect(result.case?.id).toBe("case-future-glass");
  });

  it("rejects a key whose hardware is missing from the loaded catalogue", () => {
    expect(() =>
      resolveAiProposal(
        {
          cpu: "cpu-unknown",
          gpu: "gpu-nvidia-rtx5090",
          motherboard: "motherboard-z790-lab",
          ram: "ram-ddr5-64gb",
          storage: "storage-nvme-4tb",
          cooling: "cooling-aio-360",
          power_supply: "psu-1200w-platinum",
          case: "case-future-glass",
        },
        mockHardware,
      ),
    ).toThrow(/cpu-unknown/);
  });
});
