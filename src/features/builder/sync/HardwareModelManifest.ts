import {
  type ModelManifest,
  parseModelManifest,
  type Vector3Tuple,
} from "@/three/models/modelManifest";
import type { Hardware, HardwareCategory } from "../domain/hardware";

const installationOffsets: Readonly<Record<HardwareCategory, Vector3Tuple>> = {
  case: [0, 1.6, 2.4],
  motherboard: [-2.2, 0.3, 0.3],
  cpu: [0, 1.4, 0.4],
  gpu: [2.4, 0.5, 0.25],
  ram: [0, 1.6, 0.2],
  storage: [1.2, 0.5, 0.3],
  cooling: [0, 1.8, 0.5],
  power_supply: [1.6, -0.4, 0.4],
};

const installationDurations: Readonly<Record<HardwareCategory, number>> = {
  case: 1500,
  motherboard: 1400,
  cpu: 900,
  gpu: 1200,
  ram: 900,
  storage: 900,
  cooling: 1300,
  power_supply: 1100,
};

export const createHardwareModelManifest = (hardware: Hardware): ModelManifest =>
  parseModelManifest({
    assetId: hardware.id,
    componentType: hardware.category,
    url: hardware.modelUrl,
    fallback: "placeholder",
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    installation: {
      entryOffset: installationOffsets[hardware.category],
      durationMs: installationDurations[hardware.category],
    },
    lod: [],
  });
