import { z } from "zod";

export const aiLifecycleStatusSchema = z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]);
export const aiKnowledgeCategorySchema = z.enum([
  "COMPATIBILITY",
  "POWER",
  "WORKLOAD",
  "PREFERENCE",
  "PERFORMANCE",
]);
export const aiRuleStatusSchema = z.enum(["ACTIVE", "DRAFT", "DISABLED"]);

export const aiDashboardSchema = z
  .object({
    activePrompts: z.number().int().nonnegative(),
    activeKnowledgeDocuments: z.number().int().nonnegative(),
    activeRules: z.number().int().nonnegative(),
    requestsLast24Hours: z.number().int().nonnegative(),
    failedRequestsLast24Hours: z.number().int().nonnegative(),
    averageLatencyMillis: z.number().int().nonnegative(),
    tokensLast24Hours: z.number().int().nonnegative(),
    fallbackRate: z.number().min(0).max(1),
    generatedAt: z.string().min(1),
  })
  .strict();

export const aiPromptSchema = z
  .object({
    id: z.number().int().positive(),
    promptKey: z.string().min(1),
    name: z.string().min(1),
    content: z.string().min(1),
    version: z.number().int().positive(),
    status: aiLifecycleStatusSchema,
    createdBy: z.string().min(1),
    updatedAt: z.string().min(1),
  })
  .strict();

export const aiKnowledgeSchema = z
  .object({
    id: z.number().int().positive(),
    documentKey: z.string().min(1),
    title: z.string().min(1),
    category: aiKnowledgeCategorySchema,
    content: z.string().min(1),
    tags: z.array(z.string().min(1)),
    sourceLabel: z.string().min(1),
    vectorStatus: z.enum(["PENDING", "SYNCED", "FAILED", "DISABLED"]),
    version: z.number().int().positive(),
    status: aiLifecycleStatusSchema,
    updatedAt: z.string().min(1),
  })
  .strict();

export const aiRuleSchema = z
  .object({
    id: z.number().int().positive(),
    ruleKey: z.string().min(1),
    name: z.string().min(1),
    priority: z.number().int().nonnegative(),
    condition: z.record(z.string(), z.unknown()),
    action: z.record(z.string(), z.unknown()),
    explanation: z.string().min(1),
    version: z.number().int().positive(),
    status: aiRuleStatusSchema,
    updatedAt: z.string().min(1),
  })
  .strict();

export const aiRequestLogSchema = z
  .object({
    requestId: z.string().min(1),
    sessionId: z.string().min(1),
    route: z.enum(["RULE", "LLM", "LLM_FALLBACK"]),
    purpose: z.string().nullable().optional().default(null),
    budget: z.number().nonnegative().nullable().optional().default(null),
    latencyMillis: z.number().int().nonnegative(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    outcome: z.enum(["SUCCESS", "FALLBACK", "REJECTED", "FAILED"]),
    failureCode: z.string(),
    configId: z.string().nullable().optional().default(null),
    createdAt: z.string().min(1),
  })
  .strict();

export const aiRequestLogPageSchema = z
  .object({
    page: z.number().int().positive(),
    size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    items: z.array(aiRequestLogSchema),
  })
  .strict();

export type AiDashboard = z.infer<typeof aiDashboardSchema>;
export type AiPrompt = z.infer<typeof aiPromptSchema>;
export type AiKnowledge = z.infer<typeof aiKnowledgeSchema>;
export type AiRule = z.infer<typeof aiRuleSchema>;
export type AiRequestLogPage = z.infer<typeof aiRequestLogPageSchema>;
