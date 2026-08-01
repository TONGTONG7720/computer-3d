import type { Hardware, HardwareCategory, HardwareId } from "@/features/builder/domain/hardware";

export type ModelSource = "glb" | "placeholder";

export type ModelDescriptor = {
  readonly assetId: HardwareId;
  readonly componentType: HardwareCategory;
  readonly source: ModelSource;
  readonly url: string;
};

const categoryFolders = {
  cpu: "cpu",
  gpu: "gpu",
  motherboard: "motherboard",
  ram: "ram",
  storage: "storage",
  cooling: "cooling",
  power_supply: "psu",
  case: "cases",
} as const satisfies Readonly<Record<HardwareCategory, string>>;

const preferredModelPaths: Readonly<Record<string, string>> = {
  "case-future-glass": "/models/cases/case_lianli_o11.glb",
  "cpu-intel-i9-14900k": "/models/cpu/cpu_i9.glb",
  "gpu-nvidia-rtx5090": "/models/gpu/gpu_rtx5090_founder.glb",
  "motherboard-z790-lab": "/models/motherboard/motherboard_z790_atx.glb",
  "ram-ddr5-64gb": "/models/ram/ram_ddr5.glb",
  "storage-nvme-4tb": "/models/storage/storage_nvme_4tb.glb",
  "cooling-aio-360": "/models/cooling/cooling_aio_360.glb",
  "psu-1200w-platinum": "/models/psu/psu_1200w.glb",
};

const fallbackPath = (hardware: Hardware): string => {
  const filename = hardware.modelUrl.slice(hardware.modelUrl.lastIndexOf("/") + 1);
  return `/models/${categoryFolders[hardware.category]}/${filename}`;
};

export class ModelRegistry {
  private readonly descriptors = new Map<HardwareId, ModelDescriptor>();

  register(descriptor: ModelDescriptor): void {
    this.descriptors.set(descriptor.assetId, descriptor);
  }

  resolve(hardware: Hardware): ModelDescriptor {
    const registered = this.descriptors.get(hardware.id);
    if (registered !== undefined) {
      return registered;
    }

    return {
      assetId: hardware.id,
      componentType: hardware.category,
      source: "placeholder",
      url: preferredModelPaths[hardware.id] ?? fallbackPath(hardware),
    };
  }
}
