import { z } from "zod";

const vector3Schema = z.tuple([z.number(), z.number(), z.number()]).readonly();
const modelPathSchema = z
  .string()
  .regex(/^\/models\/[a-zA-Z0-9/_-]+\.glb$/, "Model URL must be a local GLB path");

const componentTypeSchema = z.enum([
  "case",
  "motherboard",
  "cpu",
  "gpu",
  "ram",
  "storage",
  "cooling",
  "fan",
  "power_supply",
]);

const lodSchema = z
  .object({
    distance: z.number().positive(),
    url: modelPathSchema,
  })
  .readonly();

export const modelManifestSchema = z
  .object({
    assetId: z.string().min(1),
    componentType: componentTypeSchema,
    url: modelPathSchema,
    fallback: z.enum(["placeholder", "poster"]),
    transform: z
      .object({
        position: vector3Schema,
        rotation: vector3Schema,
        scale: vector3Schema,
      })
      .readonly(),
    installation: z
      .object({
        entryOffset: vector3Schema,
        durationMs: z.number().int().min(800).max(1500),
      })
      .readonly(),
    lod: z.array(lodSchema).readonly(),
  })
  .readonly();

export type ComponentType = z.infer<typeof componentTypeSchema>;
export type ModelManifest = z.infer<typeof modelManifestSchema>;
export type Vector3Tuple = z.infer<typeof vector3Schema>;

export const parseModelManifest = (input: unknown): ModelManifest =>
  modelManifestSchema.parse(input);
