import type { KyInstance } from "ky";
import { z } from "zod";
import {
  type BuildAnalysis,
  type BuildAnalysisInput,
  type BuildOptimization,
  buildAnalysisSchema,
  buildOptimizationSchema,
  type OptimizationGoal,
  selectedComponentIds,
} from "../domain/intelligence";
import { hardwarePlatformClient } from "./apiClient";

const buildAnalysisResponseSchema = z.object({
  code: z.literal("OK"),
  data: buildAnalysisSchema,
});

const buildOptimizationResponseSchema = z.object({
  code: z.literal("OK"),
  data: buildOptimizationSchema,
});

export const parseBuildAnalysis = (payload: unknown): BuildAnalysis =>
  buildAnalysisResponseSchema.parse(payload).data;

export const parseBuildOptimization = (payload: unknown): BuildOptimization =>
  buildOptimizationResponseSchema.parse(payload).data;

type RequestOptions = {
  readonly client?: KyInstance;
  readonly signal?: AbortSignal;
};

export const fetchBuildAnalysis = async (
  input: BuildAnalysisInput,
  options: RequestOptions = {},
): Promise<BuildAnalysis> => {
  const payload: unknown = await (options.client ?? hardwarePlatformClient)
    .post("build/analyze", {
      json: {
        revision: input.revision,
        budget: input.budget,
        components: selectedComponentIds(input.selection),
      },
      ...(options.signal === undefined ? {} : { signal: options.signal }),
    })
    .json();
  return parseBuildAnalysis(payload);
};

export const fetchBuildOptimization = async (
  input: BuildAnalysisInput & { readonly goal: OptimizationGoal },
  options: RequestOptions = {},
): Promise<BuildOptimization> => {
  const payload: unknown = await (options.client ?? hardwarePlatformClient)
    .post("build/optimize", {
      json: {
        revision: input.revision,
        budget: input.budget,
        components: selectedComponentIds(input.selection),
        goal: input.goal,
      },
      ...(options.signal === undefined ? {} : { signal: options.signal }),
    })
    .json();
  return parseBuildOptimization(payload);
};
