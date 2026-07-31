import type { KyInstance, Options } from "ky";
import { z } from "zod";
import { hardwarePlatformClient } from "@/features/builder/api/apiClient";
import {
  type AiDashboard,
  type AiKnowledge,
  type AiPrompt,
  type AiRequestLogPage,
  type AiRule,
  aiDashboardSchema,
  aiKnowledgeSchema,
  aiPromptSchema,
  aiRequestLogPageSchema,
  aiRuleSchema,
} from "../domain/adminAi";

const envelope = <Schema extends z.ZodType>(data: Schema) =>
  z
    .object({
      code: z.literal("OK"),
      message: z.string(),
      data,
      traceId: z.string(),
      timestamp: z.iso.datetime({ offset: true }),
    })
    .strict();

const adminHeaders = (adminKey: string): Options => ({
  headers: { "X-Admin-Key": adminKey },
});

export const parseAiDashboard = (payload: unknown): AiDashboard =>
  envelope(aiDashboardSchema).parse(payload).data;

export const parseAiLogs = (payload: unknown): AiRequestLogPage =>
  envelope(aiRequestLogPageSchema).parse(payload).data;

const parsePrompts = (payload: unknown): AiPrompt[] =>
  envelope(z.array(aiPromptSchema)).parse(payload).data;
const parseKnowledge = (payload: unknown): AiKnowledge[] =>
  envelope(z.array(aiKnowledgeSchema)).parse(payload).data;
const parseRules = (payload: unknown): AiRule[] =>
  envelope(z.array(aiRuleSchema)).parse(payload).data;

export const fetchAiDashboard = async (
  adminKey: string,
  client: KyInstance = hardwarePlatformClient,
): Promise<AiDashboard> => {
  const payload: unknown = await client.get("admin/ai/dashboard", adminHeaders(adminKey)).json();
  return parseAiDashboard(payload);
};

export const fetchAiPrompts = async (
  adminKey: string,
  client: KyInstance = hardwarePlatformClient,
): Promise<AiPrompt[]> => {
  const payload: unknown = await client.get("admin/ai/prompts", adminHeaders(adminKey)).json();
  return parsePrompts(payload);
};

export const fetchAiKnowledge = async (
  adminKey: string,
  client: KyInstance = hardwarePlatformClient,
): Promise<AiKnowledge[]> => {
  const payload: unknown = await client.get("admin/ai/knowledge", adminHeaders(adminKey)).json();
  return parseKnowledge(payload);
};

export const fetchAiRules = async (
  adminKey: string,
  client: KyInstance = hardwarePlatformClient,
): Promise<AiRule[]> => {
  const payload: unknown = await client.get("admin/ai/rules", adminHeaders(adminKey)).json();
  return parseRules(payload);
};

export const fetchAiLogs = async (
  adminKey: string,
  client: KyInstance = hardwarePlatformClient,
): Promise<AiRequestLogPage> => {
  const payload: unknown = await client
    .get("admin/ai/logs", { ...adminHeaders(adminKey), searchParams: { page: 1, size: 50 } })
    .json();
  return parseAiLogs(payload);
};

export const createPromptVersion = async (
  adminKey: string,
  promptKey: string,
  input: { readonly name: string; readonly content: string; readonly activate: boolean },
  client: KyInstance = hardwarePlatformClient,
): Promise<AiPrompt> => {
  const payload: unknown = await client
    .post(`admin/ai/prompts/${promptKey}/versions`, {
      ...adminHeaders(adminKey),
      json: { ...input, createdBy: "AI_ADMIN" },
    })
    .json();
  return envelope(aiPromptSchema).parse(payload).data;
};

export const saveKnowledge = async (
  adminKey: string,
  document: AiKnowledge,
  input: Pick<AiKnowledge, "title" | "category" | "content" | "tags" | "sourceLabel" | "status">,
  client: KyInstance = hardwarePlatformClient,
): Promise<AiKnowledge> => {
  const payload: unknown = await client
    .put(`admin/ai/knowledge/${document.documentKey}`, {
      ...adminHeaders(adminKey),
      json: { ...input, version: document.version },
    })
    .json();
  return envelope(aiKnowledgeSchema).parse(payload).data;
};

export const syncKnowledgeVector = async (
  adminKey: string,
  documentKey: string,
  client: KyInstance = hardwarePlatformClient,
): Promise<AiKnowledge> => {
  const payload: unknown = await client
    .post(`admin/ai/knowledge/${documentKey}/sync`, adminHeaders(adminKey))
    .json();
  return envelope(aiKnowledgeSchema).parse(payload).data;
};

export const saveRule = async (
  adminKey: string,
  rule: AiRule,
  input: Pick<AiRule, "name" | "priority" | "condition" | "action" | "explanation" | "status">,
  client: KyInstance = hardwarePlatformClient,
): Promise<AiRule> => {
  const payload: unknown = await client
    .put(`admin/ai/rules/${rule.ruleKey}`, {
      ...adminHeaders(adminKey),
      json: { ...input, version: rule.version },
    })
    .json();
  return envelope(aiRuleSchema).parse(payload).data;
};
