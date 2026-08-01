import type { ComponentType, Vector3Tuple } from "../models/modelManifest";

export const pcSlotIds = [
  "pc_case",
  "motherboard",
  "cpu_socket",
  "gpu_slot",
  "ram_slots",
  "storage_slots",
  "cooling_mount",
  "fan_mount",
  "psu_area",
] as const;

export type PCSlotId = (typeof pcSlotIds)[number];

export type ComponentSlot = {
  readonly slotId: PCSlotId;
  readonly componentType: ComponentType;
  readonly position: Vector3Tuple;
  readonly rotation: Vector3Tuple;
  readonly scale: Vector3Tuple;
  readonly installEntry: Vector3Tuple;
  readonly explodedOffset: Vector3Tuple;
};

const componentSlotById = {
  pc_case: {
    slotId: "pc_case",
    componentType: "case",
    position: [0, 2.45, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    installEntry: [0, 1.6, 3],
    explodedOffset: [0, 0, 0],
  },
  motherboard: {
    slotId: "motherboard",
    componentType: "motherboard",
    position: [-0.15, 2.7, -1.72],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    installEntry: [-2.4, 0.3, 1.2],
    explodedOffset: [-1.35, 0.2, -0.8],
  },
  cpu_socket: {
    slotId: "cpu_socket",
    componentType: "cpu",
    position: [-0.35, 3.05, -1.58],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    installEntry: [0, 1.5, 1.5],
    explodedOffset: [-0.2, 1.25, 0.8],
  },
  gpu_slot: {
    slotId: "gpu_slot",
    componentType: "gpu",
    position: [0.1, 2.2, -0.48],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    installEntry: [3, 0.5, 2.2],
    explodedOffset: [2.6, 0.35, 1.2],
  },
  ram_slots: {
    slotId: "ram_slots",
    componentType: "ram",
    position: [0.66, 3.34, -1.5],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    installEntry: [0.9, 1.6, 1.4],
    explodedOffset: [0.8, 1.45, 0.9],
  },
  storage_slots: {
    slotId: "storage_slots",
    componentType: "storage",
    position: [0.2, 1.7, -1.45],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    installEntry: [-1.8, 0.5, 1.4],
    explodedOffset: [-1.45, -0.15, 0.85],
  },
  cooling_mount: {
    slotId: "cooling_mount",
    componentType: "cooling",
    position: [0, 4.48, -0.15],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    installEntry: [0, 2, 0.8],
    explodedOffset: [0, 1.85, -0.2],
  },
  fan_mount: {
    slotId: "fan_mount",
    componentType: "fan",
    position: [0, 2.45, 1.83],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    installEntry: [0.5, 0, 2.2],
    explodedOffset: [0, 0.35, 1.75],
  },
  psu_area: {
    slotId: "psu_area",
    componentType: "power_supply",
    position: [-0.5, 0.65, 0.8],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    installEntry: [-2, -0.5, 1.5],
    explodedOffset: [-1.65, -0.65, 0.8],
  },
} as const satisfies Readonly<Record<PCSlotId, ComponentSlot>>;

export const componentSlots: readonly ComponentSlot[] = pcSlotIds.map(
  (slotId) => componentSlotById[slotId],
);

export const getComponentSlot = (slotId: PCSlotId): ComponentSlot => componentSlotById[slotId];
