import type { KyInstance } from "ky";
import { z } from "zod";
import {
  type Hardware,
  type HardwareModelDescriptor,
  hardwareCategorySchema,
  hardwareIdSchema,
} from "../domain/hardware";
import {
  hardwarePlatformApiUrl,
  hardwarePlatformClient,
  resolveHardwareModelUrl,
} from "./apiClient";

const socketSchema = z.enum(["LGA1700", "AM5"]);
const ramGenerationSchema = z.enum(["DDR4", "DDR5"]);
const formFactorSchema = z.enum(["ATX", "Micro-ATX"]);
const radiatorSizeSchema = z.union([z.literal(0), z.literal(240), z.literal(360)]);
const vectorSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});
const animationConfigSchema = z.string().transform((value, context) => {
  try {
    const parsed: unknown = JSON.parse(value);
    return z.record(z.string(), z.unknown()).parse(parsed);
  } catch {
    context.addIssue({ code: "custom", message: "Invalid model animation config" });
    return z.NEVER;
  }
});
const hardwareModelSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  glbUrl: z.string(),
  textureUrl: z.string(),
  previewUrl: z.string(),
  scale: vectorSchema,
  position: vectorSchema,
  rotation: vectorSchema,
  animationConfig: animationConfigSchema,
  lodLevel: z.number().int().nonnegative(),
  fileSizeBytes: z.number().int().nonnegative(),
  checksumSha256: z.string(),
  primary: z.boolean(),
  status: z.enum(["PROCESSING", "READY", "FAILED"]),
});
const performanceProfileSchema = z.object({
  gaming: z.number().int().min(0).max(100),
  creator: z.number().int().min(0).max(100),
  ai: z.number().int().min(0).max(100),
  source: z.string().min(1),
  version: z.number().int().positive(),
});

const baseHardwareShape = {
  databaseId: z.number().int().positive(),
  id: hardwareIdSchema,
  name: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().min(1),
  builderCategory: hardwareCategorySchema,
  description: z.string(),
  price: z.number().nonnegative(),
  performance: z.number().int().min(0).max(100),
  popularity: z.number().int().nonnegative(),
  performanceProfile: performanceProfileSchema,
  power: z.number().int().nonnegative(),
  modelUrl: z.string(),
  modelVariant: z.string(),
  coverUrl: z.string(),
  primaryModel: hardwareModelSchema.optional(),
};

const serverHardwareSchema = z.discriminatedUnion("builderCategory", [
  z.object({
    ...baseHardwareShape,
    builderCategory: z.literal("cpu"),
    socket: socketSchema,
    cpuGeneration: z.string().min(1),
    cores: z.number().int().positive(),
    threads: z.number().int().positive(),
    tdp: z.number().int().nonnegative(),
  }),
  z.object({
    ...baseHardwareShape,
    builderCategory: z.literal("gpu"),
    vram: z.number().int().positive(),
    length: z.number().int().positive(),
    interface: z.string().min(1),
    resolutionSupport: z.array(z.string().min(1)),
  }),
  z.object({
    ...baseHardwareShape,
    builderCategory: z.literal("motherboard"),
    socket: socketSchema,
    ramType: ramGenerationSchema,
    formFactor: formFactorSchema,
    chipset: z.string().min(1),
  }),
  z.object({
    ...baseHardwareShape,
    builderCategory: z.literal("ram"),
    capacity: z.number().positive(),
    generation: ramGenerationSchema,
    frequency: z.number().int().positive(),
  }),
  z.object({
    ...baseHardwareShape,
    builderCategory: z.literal("storage"),
    capacity: z.number().positive(),
    interface: z.enum(["PCIe 4.0", "PCIe 5.0"]),
    readSpeed: z.number().int().positive(),
  }),
  z.object({
    ...baseHardwareShape,
    builderCategory: z.literal("cooling"),
    maxTdp: z.number().int().positive(),
    radiatorSize: radiatorSizeSchema,
    supportedSockets: z.array(socketSchema).min(1),
  }),
  z.object({
    ...baseHardwareShape,
    builderCategory: z.literal("power_supply"),
    wattage: z.number().int().positive(),
    certification: z.enum(["Gold", "Platinum"]),
    connectors: z.array(z.string().min(1)),
  }),
  z.object({
    ...baseHardwareShape,
    builderCategory: z.literal("case"),
    gpuMaxLength: z.number().int().positive(),
    motherboardSize: z.array(formFactorSchema).min(1),
    radiatorMaxSize: z.union([z.literal(240), z.literal(360)]),
  }),
]);

const hardwareCatalogueResponseSchema = z.object({
  code: z.literal("OK"),
  data: z.object({
    page: z.number().int().positive(),
    size: z.number().int().positive(),
    items: z.array(serverHardwareSchema),
    total: z.number().int().nonnegative(),
    pages: z.number().int().nonnegative(),
  }),
});

type ServerHardware = z.infer<typeof serverHardwareSchema>;

const toHardwareModel = (
  model: z.infer<typeof hardwareModelSchema>,
  apiUrl: string,
): HardwareModelDescriptor => ({
  ...model,
  glbUrl: resolveHardwareModelUrl(model.glbUrl, apiUrl),
});

const toHardware = (server: ServerHardware, apiUrl: string): Hardware => {
  const common = {
    databaseId: server.databaseId,
    id: server.id,
    name: server.name,
    brand: server.brand,
    price: server.price,
    performance: server.performance,
    power: server.power,
    modelUrl: resolveHardwareModelUrl(server.modelUrl, apiUrl),
    modelVariant: server.modelVariant,
    description: server.description,
    coverUrl: server.coverUrl,
    popularity: server.popularity,
    performanceProfile: server.performanceProfile,
    ...(server.primaryModel === undefined
      ? {}
      : { primaryModel: toHardwareModel(server.primaryModel, apiUrl) }),
  };

  switch (server.builderCategory) {
    case "cpu":
      return {
        ...common,
        category: "cpu",
        socket: server.socket,
        cores: server.cores,
        threads: server.threads,
        tdp: server.tdp,
        generation: server.cpuGeneration,
      };
    case "gpu":
      return {
        ...common,
        category: "gpu",
        vram: server.vram,
        length: server.length,
        pcieInterface: server.interface,
        resolutionSupport: server.resolutionSupport,
      };
    case "motherboard":
      return {
        ...common,
        category: "motherboard",
        socket: server.socket,
        ramType: server.ramType,
        formFactor: server.formFactor,
        chipset: server.chipset,
      };
    case "ram":
      return {
        ...common,
        category: "ram",
        capacity: server.capacity,
        generation: server.generation,
        frequency: server.frequency,
      };
    case "storage":
      return {
        ...common,
        category: "storage",
        capacity: server.capacity,
        interface: server.interface,
        readSpeed: server.readSpeed,
      };
    case "cooling":
      return {
        ...common,
        category: "cooling",
        maxTdp: server.maxTdp,
        radiatorSize: server.radiatorSize,
        supportedSockets: server.supportedSockets,
      };
    case "power_supply":
      return {
        ...common,
        category: "power_supply",
        wattage: server.wattage,
        certification: server.certification,
        connectors: server.connectors,
      };
    case "case":
      return {
        ...common,
        category: "case",
        gpuMaxLength: server.gpuMaxLength,
        motherboardSize: server.motherboardSize,
        radiatorMaxSize: server.radiatorMaxSize,
      };
  }
};

export const parseHardwareCatalogue = (
  payload: unknown,
  apiUrl: string = hardwarePlatformApiUrl,
): readonly Hardware[] => {
  const response = hardwareCatalogueResponseSchema.parse(payload);
  return response.data.items.map((hardware) => toHardware(hardware, apiUrl));
};

export const hardwareSearchCategories = [
  "CPU",
  "GPU",
  "MOTHERBOARD",
  "RAM",
  "SSD",
  "COOLING",
  "PSU",
  "CASE",
] as const;

export const hardwareSearchSorts = [
  "relevance",
  "performance_desc",
  "price_asc",
  "price_desc",
  "popularity_desc",
  "newest",
] as const;

export type HardwareSearchCategory = (typeof hardwareSearchCategories)[number];
export type HardwareSearchSort = (typeof hardwareSearchSorts)[number];

export type HardwareSearchFilters = {
  readonly keyword?: string;
  readonly category?: HardwareSearchCategory;
  readonly brands?: readonly string[];
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly minPerformance?: number;
  readonly maxPower?: number;
  readonly page?: number;
  readonly size?: number;
  readonly sort?: HardwareSearchSort;
};

export type HardwarePage = {
  readonly page: number;
  readonly size: number;
  readonly total: number;
  readonly pages: number;
  readonly items: readonly Hardware[];
};

export const parseHardwarePage = (
  payload: unknown,
  apiUrl: string = hardwarePlatformApiUrl,
): HardwarePage => {
  const response = hardwareCatalogueResponseSchema.parse(payload);
  return {
    ...response.data,
    items: response.data.items.map((hardware) => toHardware(hardware, apiUrl)),
  };
};

const toSearchParams = (filters: HardwareSearchFilters): URLSearchParams => {
  const params = new URLSearchParams();
  const append = (key: string, value: string | number | undefined): void => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  };
  append("keyword", filters.keyword?.trim());
  append("category", filters.category);
  filters.brands?.forEach((brand) => {
    if (brand.trim() !== "") {
      params.append("brand", brand.trim());
    }
  });
  append("minPrice", filters.minPrice);
  append("maxPrice", filters.maxPrice);
  append("minPerformance", filters.minPerformance);
  append("maxPower", filters.maxPower);
  append("page", filters.page ?? 1);
  append("size", filters.size ?? 24);
  append("sort", filters.sort ?? "relevance");
  return params;
};

export const fetchHardwarePage = async (
  filters: HardwareSearchFilters,
  client: KyInstance = hardwarePlatformClient,
  apiUrl: string = hardwarePlatformApiUrl,
): Promise<HardwarePage> => {
  const payload: unknown = await client
    .get("hardware", { searchParams: toSearchParams(filters) })
    .json();
  return parseHardwarePage(payload, apiUrl);
};

export const fetchHardwareCatalogue = async (
  client: KyInstance = hardwarePlatformClient,
  apiUrl: string = hardwarePlatformApiUrl,
): Promise<readonly Hardware[]> => {
  const payload: unknown = await client
    .get("hardware", {
      searchParams: {
        page: 1,
        size: 100,
      },
    })
    .json();
  return parseHardwareCatalogue(payload, apiUrl);
};
