import type { Group } from "three";
import type { SceneComponent } from "../core/SceneManager";
import { materialTokens } from "../materials/MaterialSystem";
import type { ComponentType } from "../models/modelManifest";
import { createCooling } from "./Cooling";
import { createCPU } from "./CPU";
import { createFans } from "./Fans";
import { createGPU } from "./GPU";
import { createMotherboard } from "./Motherboard";
import { createPCCase } from "./PCCase";
import { createPowerSupply } from "./PowerSupply";
import { createRAM } from "./RAM";
import { createStorage } from "./Storage";

const createComponent = (slot: ComponentType, variant = "default"): Group => {
  switch (slot) {
    case "case":
      return createPCCase();
    case "motherboard":
      return createMotherboard();
    case "cpu":
      return createCPU({
        accent: variant === "ultra-9-285k" ? materialTokens.copper : materialTokens.brushedAluminum,
      });
    case "gpu":
      return createGPU({
        accent: variant === "aurora" ? materialTokens.magenta : materialTokens.cyan,
        body: variant === "aurora" ? materialTokens.auroraBody : materialTokens.plasticBlack,
      });
    case "ram":
      return createRAM();
    case "storage":
      return createStorage();
    case "cooling":
      return createCooling();
    case "fan":
      return createFans();
    case "power_supply":
      return createPowerSupply();
  }
};

export const createPlaceholderComponent = (
  slot: ComponentType,
  assetId: string,
  variant = "default",
): SceneComponent => ({
  slot,
  assetId,
  object: createComponent(slot, variant),
});

export const createDemoAssembly = (): readonly SceneComponent[] => [
  createPlaceholderComponent("case", "case-future-glass"),
  createPlaceholderComponent("motherboard", "motherboard-z790-lab"),
  createPlaceholderComponent("cpu", "cpu-intel-i9-14900k"),
  createPlaceholderComponent("gpu", "gpu-nvidia-rtx5090"),
  createPlaceholderComponent("ram", "ram-ddr5-64gb"),
  createPlaceholderComponent("storage", "storage-nvme-4tb"),
  createPlaceholderComponent("cooling", "cooling-aio-360"),
  createPlaceholderComponent("fan", "fans-rgb-120-triple"),
  createPlaceholderComponent("power_supply", "psu-1200w-platinum"),
];
