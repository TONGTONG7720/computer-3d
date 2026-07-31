import type { ReplacementSlot } from "../core/ComponentReplacementManager";
import { type ModelManifest, parseModelManifest } from "../models/modelManifest";

export type DemoReplaceableHardware = {
  readonly id: string;
  readonly slot: ReplacementSlot;
  readonly name: string;
  readonly descriptor: string;
  readonly variant: string;
  readonly performance: string;
  readonly manifest: ModelManifest;
};

const createManifest = (
  assetId: string,
  componentType: ReplacementSlot,
  url: string,
  entryOffset: readonly [number, number, number],
): ModelManifest =>
  parseModelManifest({
    assetId,
    componentType,
    url,
    fallback: "placeholder",
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    installation: {
      entryOffset,
      durationMs: 1200,
    },
    lod: [],
  });

export const demoCpuOptions: readonly DemoReplaceableHardware[] = [
  {
    id: "cpu-intel-i9-14900k",
    slot: "cpu",
    name: "Intel i9-14900K",
    descriptor: "24 cores / 32 threads",
    variant: "default",
    performance: "Creator / Gaming",
    manifest: createManifest(
      "cpu-intel-i9-14900k",
      "cpu",
      "/models/cpu_i9_14900k.glb",
      [0, 1.4, 0.4],
    ),
  },
  {
    id: "cpu-intel-ultra9-285k",
    slot: "cpu",
    name: "Intel Core Ultra 9 285K",
    descriptor: "Next-gen efficiency profile",
    variant: "ultra-9-285k",
    performance: "AI / Creator",
    manifest: createManifest(
      "cpu-intel-ultra9-285k",
      "cpu",
      "/models/cpu_ultra9_285k.glb",
      [0, 1.4, 0.4],
    ),
  },
] as const;

export const demoGpuOptions: readonly DemoReplaceableHardware[] = [
  {
    id: "gpu-nvidia-rtx5090",
    slot: "gpu",
    name: "RTX 5090",
    descriptor: "32GB flagship graphics",
    variant: "default",
    performance: "4K / AI",
    manifest: createManifest(
      "gpu-nvidia-rtx5090",
      "gpu",
      "/models/gpu_rtx5090.glb",
      [2.4, 0.5, 0.25],
    ),
  },
  {
    id: "gpu-nvidia-rtx5090-aurora",
    slot: "gpu",
    name: "RTX 5090 Aurora",
    descriptor: "Spectral lab edition",
    variant: "aurora",
    performance: "4K / AI",
    manifest: createManifest(
      "gpu-nvidia-rtx5090-aurora",
      "gpu",
      "/models/gpu_rtx5090_aurora.glb",
      [2.4, 0.5, 0.25],
    ),
  },
] as const;

export const fixedDemoHardware = {
  case: {
    name: "Future Glass Case",
    descriptor: "Dual tempered glass laboratory chassis",
  },
  motherboard: {
    name: "Z790 LAB",
    descriptor: "ATX / DDR5 / PCIe 5.0",
  },
  ram: {
    name: "DDR5 64GB",
    descriptor: "4 × 16GB RGB memory",
  },
  storage: {
    name: "NVMe 4TB",
    descriptor: "PCIe 4.0 solid-state storage",
  },
  cooling: {
    name: "LAB AIO 360",
    descriptor: "360mm liquid cooling",
  },
  fan: {
    name: "Spectral Fan Array",
    descriptor: "3 × 120mm synchronized RGB",
  },
  power_supply: {
    name: "1200W Platinum",
    descriptor: "ATX 3.1 modular power",
  },
} as const;
