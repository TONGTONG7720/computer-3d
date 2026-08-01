import type { KyInstance } from "ky";
import { z } from "zod";
import { hardwarePlatformClient } from "@/features/builder/api/apiClient";
import {
  type AdminHardwareDetail,
  type AdminHardwareModel,
  type AdminHardwareRecord,
  adminHardwareDetailSchema,
  adminHardwareRecordSchema,
  adminModelSchema,
  type CompatibilityRule,
  type CompatibilityRuleMutationInput,
  compatibilityRuleSchema,
  type HardwareMutationInput,
  type HardwarePerformance,
  hardwarePerformanceSchema,
  type ModelTransformInput,
  type PerformanceMutationInput,
} from "./adminHardware";

const envelope = <T extends z.ZodType>(schema: T) =>
  z.object({ code: z.literal("OK"), data: schema });
const adminHeaders = (adminKey: string) => ({ headers: { "X-Admin-Key": adminKey } });

export const fetchAdminHardware = async (
  adminKey: string,
  filters: { readonly keyword?: string; readonly category?: string } = {},
  client: KyInstance = hardwarePlatformClient,
): Promise<readonly AdminHardwareRecord[]> => {
  const payload: unknown = await client
    .get("admin/hardware", {
      ...adminHeaders(adminKey),
      searchParams: {
        ...(filters.keyword ? { keyword: filters.keyword } : {}),
        ...(filters.category ? { category: filters.category } : {}),
      },
    })
    .json();
  return envelope(z.array(adminHardwareRecordSchema)).parse(payload).data;
};

export const fetchAdminHardwareDetail = async (
  adminKey: string,
  hardwareId: number,
  client: KyInstance = hardwarePlatformClient,
): Promise<AdminHardwareDetail> => {
  const payload: unknown = await client
    .get(`admin/hardware/${hardwareId}`, adminHeaders(adminKey))
    .json();
  return envelope(adminHardwareDetailSchema).parse(payload).data;
};

export const createAdminHardware = async (
  adminKey: string,
  input: HardwareMutationInput,
  client: KyInstance = hardwarePlatformClient,
): Promise<AdminHardwareRecord> => {
  const payload: unknown = await client
    .post("admin/hardware", { ...adminHeaders(adminKey), json: input })
    .json();
  return envelope(adminHardwareRecordSchema).parse(payload).data;
};

export const updateAdminHardware = async (
  adminKey: string,
  hardwareId: number,
  input: HardwareMutationInput,
  client: KyInstance = hardwarePlatformClient,
): Promise<AdminHardwareRecord> => {
  const payload: unknown = await client
    .put(`admin/hardware/${hardwareId}`, { ...adminHeaders(adminKey), json: input })
    .json();
  return envelope(adminHardwareRecordSchema).parse(payload).data;
};

export const uploadAdminModel = async (
  adminKey: string,
  hardwareId: number,
  form: FormData,
  client: KyInstance = hardwarePlatformClient,
): Promise<AdminHardwareModel> => {
  const payload: unknown = await client
    .post(`admin/hardware/${hardwareId}/models`, {
      ...adminHeaders(adminKey),
      body: form,
    })
    .json();
  return envelope(adminModelSchema).parse(payload).data;
};

export const updateAdminModel = async (
  adminKey: string,
  modelId: number,
  input: ModelTransformInput,
  client: KyInstance = hardwarePlatformClient,
): Promise<AdminHardwareModel> => {
  const payload: unknown = await client
    .put(`admin/models/${modelId}`, { ...adminHeaders(adminKey), json: input })
    .json();
  return envelope(adminModelSchema).parse(payload).data;
};

export const updateAdminPerformance = async (
  adminKey: string,
  hardwareId: number,
  input: PerformanceMutationInput,
  client: KyInstance = hardwarePlatformClient,
): Promise<HardwarePerformance> => {
  const payload: unknown = await client
    .put(`admin/hardware/${hardwareId}/performance`, {
      ...adminHeaders(adminKey),
      json: input,
    })
    .json();
  return envelope(hardwarePerformanceSchema).parse(payload).data;
};

export const fetchCompatibilityRules = async (
  adminKey: string,
  client: KyInstance = hardwarePlatformClient,
): Promise<readonly CompatibilityRule[]> => {
  const payload: unknown = await client
    .get("admin/compatibility-rules", adminHeaders(adminKey))
    .json();
  return envelope(z.array(compatibilityRuleSchema)).parse(payload).data;
};

export const createCompatibilityRule = async (
  adminKey: string,
  input: CompatibilityRuleMutationInput,
  client: KyInstance = hardwarePlatformClient,
): Promise<CompatibilityRule> => {
  const payload: unknown = await client
    .post("admin/compatibility-rules", { ...adminHeaders(adminKey), json: input })
    .json();
  return envelope(compatibilityRuleSchema).parse(payload).data;
};

export const updateCompatibilityRule = async (
  adminKey: string,
  ruleId: number,
  input: CompatibilityRuleMutationInput,
  client: KyInstance = hardwarePlatformClient,
): Promise<CompatibilityRule> => {
  const payload: unknown = await client
    .put(`admin/compatibility-rules/${ruleId}`, {
      ...adminHeaders(adminKey),
      json: input,
    })
    .json();
  return envelope(compatibilityRuleSchema).parse(payload).data;
};
