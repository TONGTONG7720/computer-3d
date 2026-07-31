import type { CpuHardware, GpuHardware } from "../domain/hardware";
import { parseHardwareId } from "../domain/hardware";

export const intelI9: CpuHardware = {
  id: parseHardwareId("cpu-intel-i9-14900k"),
  name: "Intel Core i9-14900K",
  brand: "Intel",
  category: "cpu",
  price: 3999,
  performance: 96,
  power: 253,
  modelUrl: "/models/cpu_i9_14900k.glb",
  modelVariant: "intel-i9",
  socket: "LGA1700",
  cores: 24,
  threads: 32,
  tdp: 253,
};

export const amd7800X3d: CpuHardware = {
  id: parseHardwareId("cpu-amd-7800x3d"),
  name: "AMD Ryzen 7 7800X3D",
  brand: "AMD",
  category: "cpu",
  price: 2199,
  performance: 90,
  power: 120,
  modelUrl: "/models/cpu_ryzen_7800x3d.glb",
  modelVariant: "amd-7800x3d",
  socket: "AM5",
  cores: 8,
  threads: 16,
  tdp: 120,
};

export const rtx5090: GpuHardware = {
  id: parseHardwareId("gpu-nvidia-rtx5090"),
  name: "NVIDIA GeForce RTX 5090",
  brand: "NVIDIA",
  category: "gpu",
  price: 15999,
  performance: 100,
  power: 575,
  modelUrl: "/models/gpu_rtx5090.glb",
  modelVariant: "rtx5090",
  vram: 32,
  length: 304,
};

export const rtx5080: GpuHardware = {
  id: parseHardwareId("gpu-nvidia-rtx5080"),
  name: "NVIDIA GeForce RTX 5080",
  brand: "NVIDIA",
  category: "gpu",
  price: 8999,
  performance: 88,
  power: 360,
  modelUrl: "/models/gpu_rtx5080.glb",
  modelVariant: "rtx5080",
  vram: 16,
  length: 304,
};

export const rx8900Xt: GpuHardware = {
  id: parseHardwareId("gpu-amd-rx8900xt"),
  name: "AMD Radeon RX 8900 XT",
  brand: "AMD",
  category: "gpu",
  price: 6499,
  performance: 84,
  power: 355,
  modelUrl: "/models/gpu_rx8900xt.glb",
  modelVariant: "rx8900xt",
  vram: 24,
  length: 330,
};

export const rtx5070: GpuHardware = {
  id: parseHardwareId("gpu-nvidia-rtx5070"),
  name: "NVIDIA GeForce RTX 5070",
  brand: "NVIDIA",
  category: "gpu",
  price: 2799,
  performance: 70,
  power: 250,
  modelUrl: "/models/gpu_rtx5070.glb",
  modelVariant: "rtx5070",
  vram: 12,
  length: 242,
};

export const mockCpuHardware = [intelI9, amd7800X3d] as const;
export const mockGpuHardware = [rtx5090, rtx5080, rx8900Xt, rtx5070] as const;
