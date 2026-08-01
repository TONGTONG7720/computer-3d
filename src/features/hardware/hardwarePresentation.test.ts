import { describe, expect, it } from "vitest";
import { hardwareByCategory } from "@/features/builder/data/mockHardware";
import { formatHardwareSpec, hardwareCategoryLabels } from "./hardwarePresentation";

describe("hardwarePresentation", () => {
  it("formats a useful category-specific specification for every component type", () => {
    const specs = {
      cpu: formatHardwareSpec(hardwareByCategory.cpu[0]),
      gpu: formatHardwareSpec(hardwareByCategory.gpu[0]),
      motherboard: formatHardwareSpec(hardwareByCategory.motherboard[0]),
      ram: formatHardwareSpec(hardwareByCategory.ram[0]),
      storage: formatHardwareSpec(hardwareByCategory.storage[0]),
      cooling: formatHardwareSpec(hardwareByCategory.cooling[0]),
      power_supply: formatHardwareSpec(hardwareByCategory.power_supply[0]),
      case: formatHardwareSpec(hardwareByCategory.case[0]),
    };

    expect(specs.cpu).toContain("LGA1700");
    expect(specs.gpu).toContain("32GB");
    expect(specs.motherboard).toContain("ATX");
    expect(specs.ram).toContain("DDR5");
    expect(specs.storage).toContain("PCIe");
    expect(specs.cooling).toContain("TDP");
    expect(specs.power_supply).toContain("Gold");
    expect(specs.case).toContain("GPU");
    expect(Object.keys(hardwareCategoryLabels)).toHaveLength(8);
  });
});
