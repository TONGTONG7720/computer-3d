import type { KyInstance } from "ky";
import { z } from "zod";
import { hardwarePlatformClient } from "@/features/builder/api/apiClient";
import type { SelectedComponents } from "@/features/builder/domain/hardware";
import { type AiBuild, aiBuildSchema } from "../domain/aiBuild";

const aiBuildEnvelopeSchema = z
  .object({
    code: z.literal("OK"),
    message: z.string(),
    data: aiBuildSchema,
    traceId: z.string(),
    timestamp: z.iso.datetime({ offset: true }),
  })
  .strict();

export const parseAiBuildResponse = (payload: unknown): AiBuild =>
  aiBuildEnvelopeSchema.parse(payload).data;

export const selectedHardwareKeys = (
  selection: SelectedComponents,
): Readonly<Partial<Record<keyof SelectedComponents, string>>> => {
  const result: Partial<Record<keyof SelectedComponents, string>> = {};
  for (const [category, hardware] of Object.entries(selection)) {
    if (hardware !== null) {
      result[category as keyof SelectedComponents] = hardware.id;
    }
  }
  return result;
};

export const requestAiBuild = async (
  message: string,
  selection: SelectedComponents,
  sessionId?: string,
  client: KyInstance = hardwarePlatformClient,
): Promise<AiBuild> => {
  const payload: unknown = await client
    .post("ai/build", {
      json: {
        message: message.trim(),
        currentComponents: selectedHardwareKeys(selection),
        ...(sessionId ? { sessionId } : {}),
      },
    })
    .json();
  return parseAiBuildResponse(payload);
};
