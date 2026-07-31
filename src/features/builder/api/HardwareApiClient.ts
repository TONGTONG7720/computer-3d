import type { KyInstance } from "ky";
import { z } from "zod";
import { type Hardware, hardwareCategorySchema, hardwareIdSchema } from "../domain/hardware";
import {
  hardwarePlatformApiUrl,
  hardwarePlatformClient,
  resolveHardwareModelUrl,
} from "./apiClient";

const socketSchema = z.enum(["LGA1700", "AM5"]);
const ramGenerationSchema = z.enum(["DDR4", "DDR5"]);
const formFactorSchema = z.enum(["ATX", "Micro-ATX"]);
const radiatorSizeSchema = z.union([z.literal(0), z.literal(240), z.literal(360)]);

const baseHardwareShape = {
  id: hardwareIdSchema,
  name: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().min(1),
  builderCategory: hardwareCategorySchema,
  price: z.number().nonnegative(),
  performance: z.number().int().min(0).max(100),
  power: z.number().int().nonnegative(),
  modelUrl: z.string(),
  modelVariant: z.string(),
};

const serverHardwareSchema = z.discriminatedUnion("builderCategory", [
  z.object({
    ...baseHardwareShape,
    builderCategory: z.literal("cpu"),
    socket: socketSchema,
    cores: z.number().int().positive(),
    threads: z.number().int().positive(),
    tdp: z.number().int().nonnegative(),
  }),
  z.object({
    ...baseHardwareShape,
    builderCategory: z.literal("gpu"),
    vram: z.number().int().positive(),
    length: z.number().int().positive(),
  }),
  z.object({
    ...baseHardwareShape,
    builderCategory: z.literal("motherboard"),
    socket: socketSchema,
    ramType: ramGenerationSchema,
    formFactor: formFactorSchema,
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
    items: z.array(serverHardwareSchema),
    total: z.number().int().nonnegative(),
  }),
});

type ServerHardware = z.infer<typeof serverHardwareSchema>;

const toHardware = (server: ServerHardware, apiUrl: string): Hardware => {
  const common = {
    id: server.id,
    name: server.name,
    brand: server.brand,
    price: server.price,
    performance: server.performance,
    power: server.power,
    modelUrl: resolveHardwareModelUrl(server.modelUrl, apiUrl),
    modelVariant: server.modelVariant,
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
      };
    case "gpu":
      return {
        ...common,
        category: "gpu",
        vram: server.vram,
        length: server.length,
      };
    case "motherboard":
      return {
        ...common,
        category: "motherboard",
        socket: server.socket,
        ramType: server.ramType,
        formFactor: server.formFactor,
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
