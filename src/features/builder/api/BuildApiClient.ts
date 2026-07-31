import type { KyInstance } from "ky";
import { z } from "zod";
import type { SelectedComponents } from "../domain/hardware";
import { hardwarePlatformClient } from "./apiClient";

const savedBuildResponseSchema = z.object({
  code: z.literal("OK"),
  data: z.object({
    publicId: z.string().min(1),
    name: z.string().min(1),
    totalPrice: z.number().nonnegative(),
    performanceScore: z.number().int().min(0).max(100),
    powerUsageWatt: z.number().int().nonnegative(),
    compatibilityStatus: z.enum(["SUCCESS", "WARNING", "ERROR"]),
    createdAt: z.string().min(1),
  }),
});

export type SavedBuild = z.infer<typeof savedBuildResponseSchema>["data"];

export class IncompleteBuildError extends Error {
  constructor() {
    super("A build must contain all eight hardware categories.");
    this.name = "IncompleteBuildError";
  }
}

export const createSaveBuildPayload = (
  name: string,
  selection: SelectedComponents,
): {
  readonly name: string;
  readonly components: Readonly<Record<keyof SelectedComponents, string>>;
} => {
  const { cpu, gpu, motherboard, ram, storage, cooling, power_supply: powerSupply } = selection;
  const selectedCase = selection.case;
  if (
    cpu === null ||
    gpu === null ||
    motherboard === null ||
    ram === null ||
    storage === null ||
    cooling === null ||
    powerSupply === null ||
    selectedCase === null
  ) {
    throw new IncompleteBuildError();
  }
  return {
    name: name.trim(),
    components: {
      cpu: cpu.id,
      gpu: gpu.id,
      motherboard: motherboard.id,
      ram: ram.id,
      storage: storage.id,
      cooling: cooling.id,
      power_supply: powerSupply.id,
      case: selectedCase.id,
    },
  };
};

export const saveBuildToPlatform = async (
  name: string,
  selection: SelectedComponents,
  client: KyInstance = hardwarePlatformClient,
): Promise<SavedBuild> => {
  const payload: unknown = await client
    .post("build", {
      json: createSaveBuildPayload(name, selection),
    })
    .json();
  return savedBuildResponseSchema.parse(payload).data;
};
