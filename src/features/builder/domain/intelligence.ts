import { z } from "zod";
import type {
  CompatibilityResult,
  CompatibilityRule,
  CompatibilityStatus,
  CompatibilitySummary,
} from "./CompatibilityEngine";
import {
  hardwareCategories,
  hardwareCategorySchema,
  hardwareIdSchema,
  type SelectedComponents,
} from "./hardware";
import type { PerformanceScores } from "./PerformanceCalculator";

const componentIdsSchema = z.object({
  cpu: hardwareIdSchema,
  gpu: hardwareIdSchema,
  motherboard: hardwareIdSchema,
  ram: hardwareIdSchema,
  storage: hardwareIdSchema,
  cooling: hardwareIdSchema,
  power_supply: hardwareIdSchema,
  case: hardwareIdSchema,
});

const contributionSchema = z.object({
  category: z.enum([
    "CPU",
    "GPU",
    "MOTHERBOARD",
    "RAM",
    "STORAGE",
    "COOLING",
    "POWER_SUPPLY",
    "CASE",
  ]),
  inputScore: z.number().int().min(0).max(100),
  weight: z.number().min(0).max(1),
  weightedScore: z.number().nonnegative(),
});

const performanceProfileSchema = z.object({
  score: z.number().int().min(0).max(100),
  contributions: z.array(contributionSchema),
});

export const buildAnalysisSchema = z.object({
  revision: z.number().int().nonnegative(),
  components: componentIdsSchema,
  totalPrice: z.number().nonnegative(),
  systemPowerWatt: z.number().int().nonnegative(),
  priceSource: z.literal("PC_LAB_INTERNAL_REFERENCE"),
  compatibility: z.object({
    status: z.enum(["SUCCESS", "WARNING", "ERROR", "INCOMPLETE"]),
    issues: z.array(
      z.object({
        ruleCode: z.string().min(1),
        severity: z.enum(["ERROR", "WARNING"]),
        message: z.string().min(1),
        componentIds: z.array(hardwareIdSchema),
        expected: z.string(),
        actual: z.string(),
      }),
    ),
    checkedRuleCount: z.number().int().nonnegative(),
    systemPowerWatt: z.number().int().nonnegative(),
    recommendedPsuWatt: z.number().int().nonnegative(),
    missingCategories: z.array(
      z.enum(["CPU", "GPU", "MOTHERBOARD", "RAM", "STORAGE", "COOLING", "POWER_SUPPLY", "CASE"]),
    ),
  }),
  performance: z.object({
    gaming: performanceProfileSchema,
    creator: performanceProfileSchema,
    ai: performanceProfileSchema,
    overall: z.number().int().min(0).max(100),
    complete: z.boolean(),
  }),
  budget: z.object({
    status: z.enum(["WITHIN", "NEAR_LIMIT", "OVER"]),
    limit: z.number().nonnegative(),
    current: z.number().nonnegative(),
    remaining: z.number().nonnegative(),
    overage: z.number().nonnegative(),
    utilizationPercent: z.number().nonnegative(),
  }),
});

const componentChangesSchema = z
  .object({
    cpu: hardwareIdSchema.optional(),
    gpu: hardwareIdSchema.optional(),
    motherboard: hardwareIdSchema.optional(),
    ram: hardwareIdSchema.optional(),
    storage: hardwareIdSchema.optional(),
    cooling: hardwareIdSchema.optional(),
    power_supply: hardwareIdSchema.optional(),
    case: hardwareIdSchema.optional(),
  })
  .strict();

export const buildOptimizationSchema = z.object({
  revision: z.number().int().nonnegative(),
  goal: z.enum(["balanced", "gaming", "creator", "ai"]),
  recommendedComponents: componentIdsSchema,
  projectedAnalysis: buildAnalysisSchema,
  suggestions: z.array(
    z.object({
      code: z.string().min(1),
      title: z.string().min(1),
      reason: z.string().min(1),
      changes: componentChangesSchema,
      priceDelta: z.number(),
      profileDelta: z.number().int(),
      applicable: z.boolean(),
    }),
  ),
  priceDelta: z.number(),
  profileDelta: z.number().int(),
  unresolvedBudget: z.number().nonnegative(),
  changed: z.boolean(),
  reason: z.string().min(1),
});

export type BuildAnalysis = z.infer<typeof buildAnalysisSchema>;
export type BuildOptimization = z.infer<typeof buildOptimizationSchema>;
export type OptimizationGoal = BuildOptimization["goal"];
export type BudgetReport = BuildAnalysis["budget"];

export type BuildAnalysisInput = {
  readonly revision: number;
  readonly budget: number;
  readonly selection: SelectedComponents;
};

export const selectedComponentIds = (
  selection: SelectedComponents,
): z.infer<typeof componentIdsSchema> => {
  const entries = hardwareCategories.map((category) => {
    const hardware = selection[category];
    if (hardware === null) {
      throw new Error(`Missing ${category} selection`);
    }
    return [category, hardware.id] as const;
  });
  return componentIdsSchema.parse(Object.fromEntries(entries));
};

const ruleMap: Readonly<Record<string, CompatibilityRule>> = {
  CPU_MOTHERBOARD_SOCKET: "cpu-motherboard",
  RAM_MOTHERBOARD_GENERATION: "ram-motherboard",
  GPU_CASE_CLEARANCE: "gpu-case",
  CPU_COOLER_CAPACITY: "cooling-cpu",
  CPU_COOLER_SOCKET: "cooling-cpu",
  MOTHERBOARD_CASE_FORM_FACTOR: "motherboard-case",
  COOLER_CASE_RADIATOR: "cooling-case",
  SYSTEM_PSU_HEADROOM: "psu-power",
};

export const toCompatibilitySummary = (
  report: BuildAnalysis["compatibility"],
): CompatibilitySummary => {
  const status: CompatibilityStatus =
    report.status === "ERROR"
      ? "error"
      : report.status === "WARNING" || report.status === "INCOMPLETE"
        ? "warning"
        : "success";
  const results: readonly CompatibilityResult[] = report.issues.map((issue) => ({
    rule: ruleMap[issue.ruleCode] ?? "psu-power",
    status: issue.severity === "ERROR" ? "error" : "warning",
    message: issue.message,
    components: issue.componentIds,
  }));
  return { status, results, checkedRuleCount: report.checkedRuleCount };
};

export const toPerformanceScores = (report: BuildAnalysis["performance"]): PerformanceScores => ({
  overall: report.overall,
  gaming: report.gaming.score,
  production: report.creator.score,
  ai: report.ai.score,
});

export const optimizationChangesSchema = componentChangesSchema;
export { componentIdsSchema, hardwareCategorySchema };
