"use client";

import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import type {
  ReplacementPhase,
  ReplacementSlot,
  ReplacementState,
} from "@/three/core/ComponentReplacementManager";
import type { ComponentType } from "@/three/models/modelManifest";

export const rgbModes = ["cyan", "violet", "magenta", "off"] as const;
export type RgbMode = (typeof rgbModes)[number];
export type CameraMode = "overview" | "internal";

export type ReplacementCommand = {
  readonly requestId: number;
  readonly slot: ReplacementSlot;
  readonly assetId: string;
  readonly modelUrl: string;
  readonly variant: string;
};

type ReplacementCommandInput = Omit<ReplacementCommand, "requestId">;

type SelectedHardware = Readonly<Partial<Record<ComponentType, string>>>;

type LoadingState = {
  readonly status: "idle" | "loading" | "ready" | "placeholder" | "error";
  readonly progress: number;
  readonly label: string;
};

export type EngineStore = {
  readonly selectedHardware: SelectedHardware;
  readonly selectedComponent: ComponentType | null;
  readonly exploded: boolean;
  readonly rgbMode: RgbMode;
  readonly replacementRequest: ReplacementCommand | null;
  readonly replacementQueue: readonly ReplacementCommand[];
  readonly replacementState: ReplacementState;
  readonly loading: LoadingState;
  readonly cameraRevision: number;
  readonly cameraMode: CameraMode;
  readonly selectComponent: (component: ComponentType | null) => void;
  readonly toggleExploded: () => void;
  readonly cycleRgb: () => void;
  readonly requestReplacement: (command: ReplacementCommandInput) => void;
  readonly setReplacementState: (state: ReplacementState) => void;
  readonly commitHardware: (slot: ReplacementSlot, assetId: string) => void;
  readonly completeReplacement: (requestId: number) => void;
  readonly setLoading: (loading: LoadingState) => void;
  readonly resetCamera: () => void;
  readonly focusInternal: () => void;
};

const initialHardware: SelectedHardware = {
  case: "case-future-glass",
  motherboard: "motherboard-z790-lab",
  cpu: "cpu-intel-i9-14900k",
  gpu: "gpu-nvidia-rtx5090",
  ram: "ram-ddr5-64gb",
  storage: "storage-nvme-4tb",
  cooling: "cooling-aio-360",
  fan: "fans-rgb-120-triple",
  power_supply: "psu-1200w-platinum",
};

export const createEngineStore = (): StoreApi<EngineStore> => {
  let nextRequestId = 1;

  return createStore<EngineStore>()((set, get) => ({
    selectedHardware: initialHardware,
    selectedComponent: null,
    exploded: false,
    rgbMode: "cyan",
    replacementRequest: null,
    replacementQueue: [],
    replacementState: { phase: "idle" },
    loading: {
      status: "placeholder",
      progress: 1,
      label: "Procedural demo models",
    },
    cameraRevision: 0,
    cameraMode: "overview",
    selectComponent: (component) => {
      set({ selectedComponent: component });
    },
    toggleExploded: () => {
      set((state) => {
        const nextExploded = !state.exploded;
        return {
          exploded: nextExploded,
          cameraMode: nextExploded ? "overview" : state.cameraMode,
          cameraRevision: nextExploded ? state.cameraRevision + 1 : state.cameraRevision,
        };
      });
    },
    cycleRgb: () => {
      const currentIndex = rgbModes.indexOf(get().rgbMode);
      const nextMode = rgbModes[(currentIndex + 1) % rgbModes.length];
      if (nextMode !== undefined) {
        set({ rgbMode: nextMode });
      }
    },
    requestReplacement: (command) => {
      const requestId = nextRequestId;
      nextRequestId += 1;
      const nextCommand = {
        ...command,
        requestId,
      };
      set((state) => ({
        exploded: false,
        replacementRequest:
          state.replacementRequest === null ? nextCommand : state.replacementRequest,
        replacementQueue:
          state.replacementRequest === null
            ? state.replacementQueue
            : [...state.replacementQueue, nextCommand],
      }));
    },
    setReplacementState: (state) => {
      set({ replacementState: state });
    },
    commitHardware: (slot, assetId) => {
      set((state) => ({
        selectedHardware: {
          ...state.selectedHardware,
          [slot]: assetId,
        },
      }));
    },
    completeReplacement: (requestId) => {
      const state = get();
      if (state.replacementRequest?.requestId === requestId) {
        const [nextRequest, ...remainingQueue] = state.replacementQueue;
        set({
          replacementRequest: nextRequest ?? null,
          replacementQueue: remainingQueue,
        });
      }
    },
    setLoading: (loading) => {
      set({ loading });
    },
    resetCamera: () => {
      set((state) => ({
        cameraMode: "overview",
        cameraRevision: state.cameraRevision + 1,
      }));
    },
    focusInternal: () => {
      set((state) => ({
        exploded: false,
        cameraMode: state.cameraMode === "internal" ? "overview" : "internal",
        cameraRevision: state.cameraRevision + 1,
      }));
    },
  }));
};

export const engineStore = createEngineStore();

export const useEngineStore = <Selection>(selector: (state: EngineStore) => Selection): Selection =>
  useStore(engineStore, selector);

export const isReplacementBusy = (phase: ReplacementPhase): boolean =>
  phase !== "idle" && phase !== "failed";
