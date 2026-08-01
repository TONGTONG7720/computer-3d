import { z } from "zod";

export const adminHardwareCategories = [
  "CPU",
  "GPU",
  "MOTHERBOARD",
  "RAM",
  "SSD",
  "COOLING",
  "PSU",
  "CASE",
] as const;

export const adminHardwareRecordSchema = z.object({
  id: z.number().int().positive(),
  hardwareKey: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  performance: z.number().int().min(0).max(100),
  power: z.number().int().nonnegative(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  version: z.number().int().positive(),
});

export const adminModelSchema = z.object({
  id: z.number().int().positive(),
  hardwareId: z.number().int().positive(),
  name: z.string().min(1),
  glbUrl: z.string(),
  scaleX: z.number().positive(),
  scaleY: z.number().positive(),
  scaleZ: z.number().positive(),
  positionX: z.number(),
  positionY: z.number(),
  positionZ: z.number(),
  rotationX: z.number(),
  rotationY: z.number(),
  rotationZ: z.number(),
  animationConfig: z.string(),
  lodLevel: z.number().int().nonnegative(),
  primary: z.boolean(),
  status: z.enum(["PROCESSING", "READY", "FAILED"]),
  fileSizeBytes: z.number().int().nonnegative(),
  checksumSha256: z.string(),
});

export const hardwarePerformanceSchema = z.object({
  hardwareId: z.number().int().positive(),
  gaming: z.number().int().min(0).max(100),
  creator: z.number().int().min(0).max(100),
  ai: z.number().int().min(0).max(100),
  source: z.string().min(1),
  version: z.number().int().positive(),
  measuredAt: z.string(),
});

export const adminHardwareDetailSchema = adminHardwareRecordSchema.extend({
  description: z.string(),
  modelUrl: z.string(),
  modelVariant: z.string(),
  coverUrl: z.string(),
  sortOrder: z.number().int().nonnegative(),
  specification: z.record(z.string(), z.unknown()),
  performanceProfile: hardwarePerformanceSchema.nullable(),
  models: z.array(adminModelSchema),
});

export const compatibilityRuleTypes = [
  "SOCKET_MATCH",
  "MEMORY_GENERATION",
  "GPU_CLEARANCE",
  "CPU_COOLING_TDP",
  "COOLER_SOCKET",
  "MOTHERBOARD_FORM_FACTOR",
  "RADIATOR_CLEARANCE",
  "PSU_HEADROOM",
] as const;

export const compatibilityRuleSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().min(1),
  sourceCategory: z.string().min(1),
  targetCategory: z.string().min(1),
  type: z.enum(compatibilityRuleTypes),
  severity: z.enum(["ERROR", "WARNING"]),
  message: z.string().min(1),
  config: z.object({
    reserveWatt: z.number().int().nonnegative(),
    headroomRatio: z.number().min(1),
    roundingWatt: z.number().int().positive(),
  }),
  priority: z.number().int().nonnegative(),
  enabled: z.boolean(),
  version: z.number().int().positive(),
  updatedAt: z.string(),
});

export type AdminHardwareCategory = (typeof adminHardwareCategories)[number];
export type AdminHardwareRecord = z.infer<typeof adminHardwareRecordSchema>;
export type AdminHardwareDetail = z.infer<typeof adminHardwareDetailSchema>;
export type AdminHardwareModel = z.infer<typeof adminModelSchema>;
export type HardwarePerformance = z.infer<typeof hardwarePerformanceSchema>;
export type CompatibilityRule = z.infer<typeof compatibilityRuleSchema>;
export type CompatibilityRuleType = (typeof compatibilityRuleTypes)[number];

export type HardwareMutationInput = {
  readonly hardwareKey: string;
  readonly name: string;
  readonly brand: string;
  readonly category: string;
  readonly description: string;
  readonly price: number;
  readonly performance: number;
  readonly power: number;
  readonly modelUrl: string;
  readonly modelVariant: string;
  readonly coverUrl: string;
  readonly sortOrder: number;
  readonly status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  readonly version?: number;
  readonly specification: Readonly<Record<string, unknown>>;
};

export type PerformanceMutationInput = {
  readonly gaming: number;
  readonly creator: number;
  readonly ai: number;
  readonly source: string;
  readonly version: number;
};

export type ModelTransformInput = Omit<
  AdminHardwareModel,
  "id" | "hardwareId" | "glbUrl" | "fileSizeBytes" | "checksumSha256"
>;

export type CompatibilityRuleMutationInput = Omit<CompatibilityRule, "id" | "updatedAt">;
