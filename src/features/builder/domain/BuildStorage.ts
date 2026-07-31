import { z } from "zod";
import {
  hardwareCategories,
  hardwareIdSchema,
  type SelectedComponents,
  toSelectedComponentIds,
} from "./hardware";
import type { PerformanceScores } from "./PerformanceCalculator";

export const buildStorageKey = "pc-lab-builds-v1";

const selectedComponentIdsSchema = z
  .object({
    cpu: hardwareIdSchema.nullable(),
    gpu: hardwareIdSchema.nullable(),
    motherboard: hardwareIdSchema.nullable(),
    ram: hardwareIdSchema.nullable(),
    storage: hardwareIdSchema.nullable(),
    cooling: hardwareIdSchema.nullable(),
    power_supply: hardwareIdSchema.nullable(),
    case: hardwareIdSchema.nullable(),
  })
  .readonly();

const performanceSchema = z
  .object({
    overall: z.number().int().min(0).max(100),
    gaming: z.number().int().min(0).max(100),
    production: z.number().int().min(0).max(100),
    ai: z.number().int().min(0).max(100),
  })
  .readonly();

export const buildConfigSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1),
    name: z.string().trim().min(1).max(60),
    createdAt: z.iso.datetime(),
    components: selectedComponentIdsSchema,
    price: z.number().nonnegative(),
    performance: performanceSchema,
  })
  .readonly();

const buildConfigListSchema = z.array(buildConfigSchema).readonly();

export type BuildConfig = z.infer<typeof buildConfigSchema>;

export type BuildStorage = {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
};

export type CreateBuildConfigInput = {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly components: SelectedComponents;
  readonly price: number;
  readonly performance: PerformanceScores;
};

export const createBuildConfig = (input: CreateBuildConfigInput): BuildConfig =>
  buildConfigSchema.parse({
    schemaVersion: 1,
    id: input.id,
    name: input.name,
    createdAt: input.createdAt,
    components: toSelectedComponentIds(input.components),
    price: input.price,
    performance: input.performance,
  });

export const loadBuildConfigs = (storage: BuildStorage): readonly BuildConfig[] => {
  const raw = storage.getItem(buildStorageKey);
  if (raw === null) {
    return [];
  }

  try {
    const decoded: unknown = JSON.parse(raw);
    const parsed = buildConfigListSchema.safeParse(decoded);
    return parsed.success ? parsed.data : [];
  } catch (error) {
    if (error instanceof SyntaxError) {
      return [];
    }
    throw error;
  }
};

export const saveBuildConfig = (storage: BuildStorage, config: BuildConfig): void => {
  const existing = loadBuildConfigs(storage);
  const next = [config, ...existing.filter((entry) => entry.id !== config.id)].slice(0, 20);
  storage.setItem(buildStorageKey, JSON.stringify(next));
};

export const savedComponentCategories = hardwareCategories;
