import { z } from "zod";
import { hardwareCategories, hardwareCategorySchema } from "@/features/builder/domain/hardware";

const routeSchema = z.enum(["RULE", "LLM", "LLM_FALLBACK"]);
const purposeSchema = z.enum(["GAMING", "OFFICE", "DESIGN", "PROGRAMMING", "AI_TRAINING"]);
const prioritySchema = z.enum(["GPU", "CPU", "QUIET", "VALUE"]);
const styleSchema = z.enum(["WHITE", "RGB"]);
const componentTargetSchema = z.enum(["CPU", "GPU"]);

const componentIdsSchema = z
  .object(
    Object.fromEntries(hardwareCategories.map((category) => [category, z.string().min(1)])) as {
      [Category in (typeof hardwareCategories)[number]]: z.ZodString;
    },
  )
  .strict();

const requirementSchema = z
  .object({
    budget: z.number().nonnegative().nullable(),
    purposes: z.array(purposeSchema),
    priorities: z.array(prioritySchema),
    styles: z.array(styleSchema),
    formFactor: z.enum(["ANY", "COMPACT"]),
    requestedChanges: z.partialRecord(componentTargetSchema, z.string().min(1)),
    missingInformation: z.array(z.string().min(1)),
  })
  .strict();

const componentChangeSchema = z
  .object({
    category: hardwareCategorySchema,
    previousHardwareId: z.string().min(1),
    selectedHardwareId: z.string().min(1),
  })
  .strict();

const alternativeSchema = z
  .object({
    label: z.string().min(1),
    totalPrice: z.number().nonnegative(),
    purposeScore: z.number().int().min(0).max(100),
    tradeoff: z.string().min(1),
  })
  .strict();

const knowledgeSourceSchema = z
  .object({
    sourceKey: z.string().min(1),
    title: z.string().min(1),
    score: z.number().min(0).max(1),
    revision: z.number().int().positive(),
  })
  .strict();

export const aiBuildSchema = z
  .object({
    requestId: z.uuid(),
    sessionId: z.uuid(),
    route: routeSchema,
    requirement: requirementSchema,
    configId: z.string().min(1),
    components: componentIdsSchema,
    totalPrice: z.number().nonnegative(),
    performanceScore: z.number().int().min(0).max(100),
    powerUsageWatt: z.number().int().nonnegative(),
    compatibilityStatus: z.enum(["SUCCESS", "WARNING", "ERROR"]),
    requiresConfirmation: z.boolean(),
    assistantMessage: z.string().min(1),
    componentReasons: z.record(z.string(), z.string().min(1)),
    changedDependencies: z.array(componentChangeSchema),
    alternatives: z.array(alternativeSchema),
    knowledgeSources: z.array(knowledgeSourceSchema),
    unfulfilledPreferences: z.array(z.string().min(1)),
  })
  .strict();

export type AiBuild = z.infer<typeof aiBuildSchema>;
export type AiComponentIds = z.infer<typeof componentIdsSchema>;
