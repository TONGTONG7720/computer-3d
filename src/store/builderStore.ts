"use client";

import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import { fetchBuildAnalysis } from "@/features/builder/api/BuildIntelligenceApiClient";
import { fetchHardwareCatalogue } from "@/features/builder/api/HardwareApiClient";
import {
  type CompatibilitySummary,
  evaluateCompatibility,
} from "@/features/builder/domain/CompatibilityEngine";
import {
  emptySelectedComponents,
  type Hardware,
  type HardwareCategory,
  hardwareCategories,
  replaceSelectedHardware,
  type SelectedComponents,
} from "@/features/builder/domain/hardware";
import {
  type BudgetReport,
  type BuildAnalysis,
  type BuildAnalysisInput,
  toCompatibilitySummary,
  toPerformanceScores,
} from "@/features/builder/domain/intelligence";
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

export type CatalogueStatus = "idle" | "loading" | "ready" | "error";
export type CatalogueLoader = () => Promise<readonly Hardware[]>;
export type AnalysisStatus = "idle" | "loading" | "ready" | "error";
export type AnalysisLoader = (
  input: BuildAnalysisInput,
  signal: AbortSignal,
) => Promise<BuildAnalysis>;

export type BuilderStore = {
  readonly catalogue: readonly Hardware[];
  readonly catalogueStatus: CatalogueStatus;
  readonly catalogueError: string | null;
  readonly budget: number;
  readonly budgetReport: BudgetReport | null;
  readonly priceSource: BuildAnalysis["priceSource"] | null;
  readonly analysisStatus: AnalysisStatus;
  readonly analysisError: string | null;
  readonly analysisRevision: number | null;
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
  readonly setBudget: (budget: number) => void;
  readonly initializeCatalogue: () => Promise<void>;
  readonly retryCatalogue: () => Promise<void>;
  readonly refreshAnalysis: () => Promise<void>;
  readonly retryAnalysis: () => Promise<void>;
  readonly applyAuthoritativeAnalysis: (analysis: BuildAnalysis) => boolean;
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

const preferredHardwareIds = {
  cpu: "cpu-intel-i9-14900k",
  gpu: "gpu-nvidia-rtx5090",
  motherboard: "motherboard-z790-lab",
  ram: "ram-ddr5-64gb",
  storage: "storage-nvme-4tb",
  cooling: "cooling-aio-360",
  power_supply: "psu-1200w-platinum",
  case: "case-future-glass",
} as const satisfies Readonly<Record<HardwareCategory, string>>;

export class IncompleteCatalogueError extends Error {
  constructor(readonly missingCategories: readonly HardwareCategory[]) {
    super(`Catalogue is missing: ${missingCategories.join(", ")}`);
    this.name = "IncompleteCatalogueError";
  }
}

export const selectDefaultComponents = (catalogue: readonly Hardware[]): SelectedComponents => {
  let selection = emptySelectedComponents();
  const missing: HardwareCategory[] = [];
  for (const category of hardwareCategories) {
    const options = catalogue.filter((hardware) => hardware.category === category);
    const selected =
      options.find((hardware) => hardware.id === preferredHardwareIds[category]) ?? options[0];
    if (selected === undefined) {
      missing.push(category);
    } else {
      selection = replaceSelectedHardware(selection, selected);
    }
  }
  if (missing.length > 0) {
    throw new IncompleteCatalogueError(missing);
  }
  return selection;
};

type CreateBuilderStoreOptions = {
  readonly initialCatalogue?: readonly Hardware[];
  readonly catalogueLoader?: CatalogueLoader;
  readonly analysisLoader?: AnalysisLoader;
  readonly initialBudget?: number;
};

const catalogueFailureMessage = "无法连接硬件数据中心，请确认 Spring Boot 服务已在 8088 端口启动。";
const analysisFailureMessage = "配置分析暂时不可用，请重试或检查硬件数据中心。";

const defaultAnalysisLoader: AnalysisLoader = (input, signal) =>
  fetchBuildAnalysis(input, { signal });

export const createBuilderStore = (
  options: CreateBuilderStoreOptions = {},
): StoreApi<BuilderStore> => {
  const initialCatalogue = options.initialCatalogue ?? [];
  const initialSelection =
    initialCatalogue.length > 0
      ? selectDefaultComponents(initialCatalogue)
      : emptySelectedComponents();
  const initialDerived = deriveBuilderState(initialSelection);
  const catalogueLoader = options.catalogueLoader ?? fetchHardwareCatalogue;
  const analysisLoader = options.analysisLoader ?? defaultAnalysisLoader;
  const initialBudget = options.initialBudget ?? 30_000;
  let analysisController: AbortController | null = null;

  return createStore<BuilderStore>()((set, get) => {
    const applyAuthoritativeAnalysis = (analysis: BuildAnalysis): boolean => {
      if (analysis.revision !== get().feedback.revision) {
        return false;
      }
      set({
        totalPrice: analysis.totalPrice,
        powerUsage: analysis.systemPowerWatt,
        performanceScore: toPerformanceScores(analysis.performance),
        compatibilityStatus: toCompatibilitySummary(analysis.compatibility),
        budgetReport: analysis.budget,
        priceSource: analysis.priceSource,
        analysisStatus: "ready",
        analysisError: null,
        analysisRevision: analysis.revision,
      });
      return true;
    };

    const refreshAnalysis = async (): Promise<void> => {
      const state = get();
      if (state.catalogueStatus !== "ready") {
        return;
      }
      analysisController?.abort();
      const controller = new AbortController();
      analysisController = controller;
      const revision = state.feedback.revision;
      set({ analysisStatus: "loading", analysisError: null });
      try {
        const analysis = await analysisLoader(
          {
            revision,
            budget: state.budget,
            selection: state.selectedComponents,
          },
          controller.signal,
        );
        if (!controller.signal.aborted) {
          applyAuthoritativeAnalysis(analysis);
        }
      } catch (error) {
        if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
          return;
        }
        if (get().feedback.revision === revision) {
          set({ analysisStatus: "error", analysisError: analysisFailureMessage });
        }
      }
    };

    const loadCatalogue = async (force: boolean): Promise<void> => {
      const status = get().catalogueStatus;
      if (!force && (status === "loading" || status === "ready")) {
        return;
      }
      set({ catalogueStatus: "loading", catalogueError: null });
      try {
        const catalogue = await catalogueLoader();
        const selectedComponents = selectDefaultComponents(catalogue);
        set({
          catalogue,
          catalogueStatus: "ready",
          catalogueError: null,
          selectedComponents,
          analysisStatus: "idle",
          analysisError: null,
          analysisRevision: null,
          ...deriveBuilderState(selectedComponents),
        });
      } catch {
        set({
          catalogueStatus: "error",
          catalogueError: catalogueFailureMessage,
        });
      }
    };

    return {
      catalogue: initialCatalogue,
      catalogueStatus: initialCatalogue.length > 0 ? "ready" : "idle",
      catalogueError: null,
      budget: initialBudget,
      budgetReport: null,
      priceSource: null,
      analysisStatus: "idle",
      analysisError: null,
      analysisRevision: null,
      selectedComponents: initialSelection,
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
          analysisStatus: "idle",
          analysisError: null,
          analysisRevision: null,
          budgetReport: null,
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
          analysisStatus: "idle",
          analysisError: null,
          analysisRevision: null,
          budgetReport: null,
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
      setBudget: (budget) => {
        if (!Number.isFinite(budget) || budget < 0) {
          throw new RangeError("Budget must be a non-negative finite number");
        }
        const previous = get();
        if (previous.budget === budget) {
          return;
        }
        set({
          budget,
          budgetReport: null,
          analysisStatus: "idle",
          analysisError: null,
          analysisRevision: null,
          feedback: {
            ...previous.feedback,
            revision: previous.feedback.revision + 1,
          },
        });
      },
      initializeCatalogue: () => loadCatalogue(false),
      retryCatalogue: () => loadCatalogue(true),
      refreshAnalysis,
      retryAnalysis: refreshAnalysis,
      applyAuthoritativeAnalysis,
    };
  });
};

export const builderStore = createBuilderStore();

export const useBuilderStore = <Selection>(
  selector: (state: BuilderStore) => Selection,
): Selection => useStore(builderStore, selector);
