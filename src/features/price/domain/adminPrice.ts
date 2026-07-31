import { z } from "zod";
import { apiDateTimeSchema, pricePlatformSchema } from "./price";

const identifierSchema = z.number().int().positive();
const optionalUrlSchema = z.union([z.literal(""), z.url()]);

export const adminOfferSchema = z
  .object({
    id: identifierSchema,
    productId: identifierSchema,
    platform: pricePlatformSchema,
    seller: z.string().min(1),
    shopType: z.enum(["SELF_OPERATED", "BRAND_STORE", "MARKETPLACE"]),
    salePrice: z.number().nonnegative(),
    couponAmount: z.number().nonnegative(),
    fullReductionAmount: z.number().nonnegative(),
    memberDiscountAmount: z.number().nonnegative(),
    platformSubsidyAmount: z.number().nonnegative(),
    shippingFee: z.number().nonnegative(),
    finalPrice: z.number().nonnegative(),
    salesCount: z.number().int().nonnegative(),
    rating: z.number().min(0).max(5),
    sellerScore: z.number().min(0).max(100),
    currency: z.string().length(3),
    stockStatus: z.enum(["IN_STOCK", "OUT_OF_STOCK", "PREORDER"]),
    productUrl: optionalUrlSchema,
    affiliateUrl: optionalUrlSchema,
    recordSource: z.string().min(1),
    enabled: z.boolean(),
    reviewed: z.boolean(),
    version: z.number().int().positive(),
    stale: z.boolean(),
    checkedAt: apiDateTimeSchema,
  })
  .strict();

export const adminProductSchema = z
  .object({
    id: identifierSchema,
    productKey: z.string().min(1),
    hardwareId: identifierSchema.nullable(),
    title: z.string().min(1),
    brand: z.string().min(1),
    model: z.string().min(1),
    category: z.string().min(1),
    imageUrl: optionalUrlSchema,
    description: z.string(),
    matchConfidence: z.number().min(0).max(1),
    matchStatus: z.string().min(1),
    status: z.enum(["ACTIVE", "DRAFT", "DISABLED"]),
    recordSource: z.string().min(1),
    version: z.number().int().positive(),
    offers: z.array(adminOfferSchema),
    updatedAt: apiDateTimeSchema,
  })
  .strict();

export const adminDashboardSchema = z
  .object({
    activeProducts: z.number().int().nonnegative(),
    validOffers: z.number().int().nonnegative(),
    staleOffers: z.number().int().nonnegative(),
    missingCoverage: z.number().int().nonnegative(),
    clicksLast24Hours: z.number().int().nonnegative(),
    topClickedHardware: z.array(
      z
        .object({
          hardwareKey: z.string().min(1),
          hardwareName: z.string().min(1),
          clickCount: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    dataMode: z.string().min(1),
    generatedAt: apiDateTimeSchema,
  })
  .strict();

export const matchPreviewSchema = z
  .object({
    hardwareId: identifierSchema,
    hardwareKey: z.string().min(1),
    hardwareName: z.string().min(1),
    confidence: z.number().min(0).max(1),
    decision: z.enum(["CONFIRMED", "REVIEW_REQUIRED", "REJECTED"]),
    dimensionScores: z.record(z.string(), z.number().min(0).max(1)),
    explanations: z.array(z.string().min(1)),
  })
  .strict();

export const adminProductPageSchema = z
  .object({
    page: z.number().int().positive(),
    size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    items: z.array(adminProductSchema),
  })
  .strict();

export type AdminOffer = z.infer<typeof adminOfferSchema>;
export type AdminProduct = z.infer<typeof adminProductSchema>;
export type AdminDashboard = z.infer<typeof adminDashboardSchema>;
export type MatchPreview = z.infer<typeof matchPreviewSchema>;
export type AdminProductPage = z.infer<typeof adminProductPageSchema>;

export type UpsertProductInput = {
  readonly title: string;
  readonly brand: string;
  readonly model: string;
  readonly category: string;
  readonly imageUrl: string;
  readonly description: string;
  readonly hardwareId: number | null;
  readonly status: "ACTIVE" | "DRAFT" | "DISABLED";
  readonly version?: number;
};

export type UpsertOfferInput = {
  readonly platform: z.infer<typeof pricePlatformSchema>;
  readonly seller: string;
  readonly shopType: "SELF_OPERATED" | "BRAND_STORE" | "MARKETPLACE";
  readonly salePrice: number;
  readonly couponAmount: number;
  readonly fullReductionAmount: number;
  readonly memberDiscountAmount: number;
  readonly platformSubsidyAmount: number;
  readonly shippingFee: number;
  readonly salesCount: number;
  readonly rating: number;
  readonly sellerScore: number;
  readonly currency: string;
  readonly stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "PREORDER";
  readonly productUrl: string;
  readonly affiliateUrl: string;
  readonly enabled: boolean;
  readonly reviewed: boolean;
  readonly version?: number;
};
