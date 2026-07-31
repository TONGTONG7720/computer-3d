import type { Hardware, SelectedComponents } from "./hardware";

export type PerformanceScores = {
  readonly overall: number;
  readonly gaming: number;
  readonly production: number;
  readonly ai: number;
};

type WeightedComponent = {
  readonly component: Hardware | null;
  readonly weight: number;
};

const weightedScore = (components: readonly WeightedComponent[]): number => {
  const score = components.reduce(
    (total, entry) => total + (entry.component?.performance ?? 0) * entry.weight,
    0,
  );
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const calculatePerformance = (selection: SelectedComponents): PerformanceScores => {
  const gaming = weightedScore([
    { component: selection.gpu, weight: 0.55 },
    { component: selection.cpu, weight: 0.3 },
    { component: selection.ram, weight: 0.1 },
    { component: selection.storage, weight: 0.05 },
  ]);
  const production = weightedScore([
    { component: selection.cpu, weight: 0.4 },
    { component: selection.gpu, weight: 0.3 },
    { component: selection.ram, weight: 0.15 },
    { component: selection.storage, weight: 0.15 },
  ]);
  const ai = weightedScore([
    { component: selection.gpu, weight: 0.65 },
    { component: selection.cpu, weight: 0.15 },
    { component: selection.ram, weight: 0.15 },
    { component: selection.storage, weight: 0.05 },
  ]);

  return {
    overall: Math.round((gaming + production + ai) / 3),
    gaming,
    production,
    ai,
  };
};
