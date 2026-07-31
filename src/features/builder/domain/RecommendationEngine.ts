import { evaluateCompatibility } from "./CompatibilityEngine";
import {
  emptySelectedComponents,
  type Hardware,
  hardwareCategories,
  replaceSelectedHardware,
  type SelectedComponents,
} from "./hardware";
import { calculatePerformance, type PerformanceScores } from "./PerformanceCalculator";
import { calculateTotalPrice } from "./PriceCalculator";

export const recommendationUseCases = ["gaming", "productivity", "ai"] as const;
export type RecommendationUseCase = (typeof recommendationUseCases)[number];

export type RecommendationRequest = {
  readonly budget: number;
  readonly useCase: RecommendationUseCase;
};

export type BuildRecommendation = {
  readonly components: SelectedComponents;
  readonly totalPrice: number;
  readonly performance: PerformanceScores;
  readonly overBudget: boolean;
  readonly reasons: readonly string[];
};

type Candidate = {
  readonly components: SelectedComponents;
  readonly totalPrice: number;
  readonly performance: PerformanceScores;
};

export class RecommendationUnavailableError extends Error {
  constructor() {
    super("No compatible hardware combination is available.");
    this.name = "RecommendationUnavailableError";
  }
}

const enumerateSelections = (catalogue: readonly Hardware[]): readonly SelectedComponents[] => {
  const selections: SelectedComponents[] = [];

  const visit = (index: number, selection: SelectedComponents): void => {
    const category = hardwareCategories[index];
    if (category === undefined) {
      selections.push(selection);
      return;
    }

    const options = catalogue.filter((hardware) => hardware.category === category);
    for (const option of options) {
      visit(index + 1, replaceSelectedHardware(selection, option));
    }
  };

  visit(0, emptySelectedComponents());
  return selections;
};

const buildCandidates = (catalogue: readonly Hardware[]): readonly Candidate[] =>
  enumerateSelections(catalogue)
    .filter((selection) => evaluateCompatibility(selection).status !== "error")
    .map((components) => ({
      components,
      totalPrice: calculateTotalPrice(components),
      performance: calculatePerformance(components),
    }));

const useCaseScore = (performance: PerformanceScores, useCase: RecommendationUseCase): number => {
  switch (useCase) {
    case "gaming":
      return performance.gaming;
    case "productivity":
      return performance.production;
    case "ai":
      return performance.ai;
  }
};

const compareWithinBudget =
  (request: RecommendationRequest) =>
  (left: Candidate, right: Candidate): number => {
    const performanceDelta =
      useCaseScore(right.performance, request.useCase) -
      useCaseScore(left.performance, request.useCase);
    if (performanceDelta !== 0) {
      return performanceDelta;
    }
    return right.totalPrice - left.totalPrice;
  };

const describeRecommendation = (
  request: RecommendationRequest,
  candidate: Candidate,
): readonly string[] => {
  const cpu = candidate.components.cpu;
  const gpu = candidate.components.gpu;
  const lead =
    request.useCase === "gaming"
      ? `游戏权重优先显卡与 CPU，当前游戏评分 ${candidate.performance.gaming}`
      : request.useCase === "productivity"
        ? `生产力权重平衡多核、显卡与内存，当前评分 ${candidate.performance.production}`
        : `AI 权重优先显存与 GPU 性能，当前 AI 评分 ${candidate.performance.ai}`;

  return [
    lead,
    `${cpu?.name ?? "待选 CPU"} + ${gpu?.name ?? "待选 GPU"} 是预算内的最高权重组合`,
    `整机价格 ¥${candidate.totalPrice.toLocaleString("zh-CN")}`,
  ];
};

export const recommendBuild = (
  request: RecommendationRequest,
  catalogue: readonly Hardware[],
): BuildRecommendation => {
  const candidates = buildCandidates(catalogue);
  const withinBudget = candidates
    .filter((candidate) => candidate.totalPrice <= request.budget)
    .sort(compareWithinBudget(request));
  const selected =
    withinBudget[0] ?? [...candidates].sort((left, right) => left.totalPrice - right.totalPrice)[0];

  if (selected === undefined) {
    throw new RecommendationUnavailableError();
  }

  return {
    components: selected.components,
    totalPrice: selected.totalPrice,
    performance: selected.performance,
    overBudget: selected.totalPrice > request.budget,
    reasons: describeRecommendation(request, selected),
  };
};
