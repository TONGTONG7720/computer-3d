"use client";

import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import { defaultSelectedComponents } from "@/features/builder/data/mockHardware";
import {
  type CompatibilitySummary,
  evaluateCompatibility,
} from "@/features/builder/domain/CompatibilityEngine";
import {
  type Hardware,
  type HardwareCategory,
  replaceSelectedHardware,
  type SelectedComponents,
} from "@/features/builder/domain/hardware";
import {
  calculatePerformance,
  type PerformanceScores,
} from "@/features/builder/domain/PerformanceCalculator";
import {
  calculatePowerUsage,
  calculateTotalPrice,
} from "@/features/builder/domain/PriceCalculator";

export type BuilderFeedback = {
  readonly priceDelta: number;
  readonly scoreDelta: number;
  readonly compatibilityChanged: boolean;
  readonly revision: number;
};

export type BuilderStore = {
  readonly selectedComponents: SelectedComponents;
  readonly totalPrice: number;
  readonly powerUsage: number;
  readonly performanceScore: PerformanceScores;
  readonly compatibilityStatus: CompatibilitySummary;
  readonly activeCategory: HardwareCategory;
  readonly feedback: BuilderFeedback;
  readonly selectHardware: (hardware: Hardware) => void;
  readonly applySelection: (selection: SelectedComponents) => void;
  readonly setActiveCategory: (category: HardwareCategory) => void;
};

type DerivedBuilderState = {
  readonly totalPrice: number;
  readonly powerUsage: number;
  readonly performanceScore: PerformanceScores;
  readonly compatibilityStatus: CompatibilitySummary;
};

const deriveBuilderState = (selection: SelectedComponents): DerivedBuilderState => ({
  totalPrice: calculateTotalPrice(selection),
  powerUsage: calculatePowerUsage(selection),
  performanceScore: calculatePerformance(selection),
  compatibilityStatus: evaluateCompatibility(selection),
});

const initialDerived = deriveBuilderState(defaultSelectedComponents);

export const createBuilderStore = (): StoreApi<BuilderStore> =>
  createStore<BuilderStore>()((set, get) => ({
    selectedComponents: defaultSelectedComponents,
    ...initialDerived,
    activeCategory: "cpu",
    feedback: {
      priceDelta: 0,
      scoreDelta: 0,
      compatibilityChanged: false,
      revision: 0,
    },
    selectHardware: (hardware) => {
      const previous = get();
      const selectedComponents = replaceSelectedHardware(previous.selectedComponents, hardware);
      const derived = deriveBuilderState(selectedComponents);
      set({
        selectedComponents,
        ...derived,
        activeCategory: hardware.category,
        feedback: {
          priceDelta: derived.totalPrice - previous.totalPrice,
          scoreDelta: derived.performanceScore.overall - previous.performanceScore.overall,
          compatibilityChanged:
            derived.compatibilityStatus.status !== previous.compatibilityStatus.status,
          revision: previous.feedback.revision + 1,
        },
      });
    },
    applySelection: (selectedComponents) => {
      const previous = get();
      const derived = deriveBuilderState(selectedComponents);
      set({
        selectedComponents,
        ...derived,
        feedback: {
          priceDelta: derived.totalPrice - previous.totalPrice,
          scoreDelta: derived.performanceScore.overall - previous.performanceScore.overall,
          compatibilityChanged:
            derived.compatibilityStatus.status !== previous.compatibilityStatus.status,
          revision: previous.feedback.revision + 1,
        },
      });
    },
    setActiveCategory: (activeCategory) => {
      set({ activeCategory });
    },
  }));

export const builderStore = createBuilderStore();

export const useBuilderStore = <Selection>(
  selector: (state: BuilderStore) => Selection,
): Selection => useStore(builderStore, selector);
