import { z } from "zod";

export const pricePlatformSchema = z.enum(["JD", "TAOBAO", "PDD", "TMALL", "AMAZON", "SUNING"]);

export const priceRangeSchema = z.enum(["7D", "30D"]);
export const apiDateTimeSchema = z.iso.datetime({ local: true });

const nullablePriceSchema = z.number().nonnegative().nullable();
const identifierSchema = z.number().int().positive();

export const priceOfferSchema = z
  .object({
    id: identifierSchema,
    platform: pricePlatformSchema,
    platformLabel: z.string().min(1),
    seller: z.string().min(1),
    shopType: z.string().min(1),
    salePrice: z.number().nonnegative(),
    discount: z.number().nonnegative(),
    shipping: z.number().nonnegative(),
    finalPrice: z.number().nonnegative(),
    rating: z.number().min(0).max(5),
    salesCount: z.number().int().nonnegative(),
    trustScore: z.number().min(0).max(100),
    rankingScore: z.number().min(0).max(100),
    matchConfidence: z.number().min(0).max(1),
    stale: z.boolean(),
    tags: z.array(z.string().min(1)),
    redirectPath: z.string().startsWith("/api/price-intelligence/offers/"),
    recordSource: z.string().min(1),
  })
  .strict();

const comparisonDataSchema = z
  .object({
    hardwareKey: z.string().min(1),
    hardwareName: z.string().min(1),
    internalReferencePrice: z.number().nonnegative(),
    lowestPrice: nullablePriceSchema,
    lowestOfferId: identifierSchema.nullable(),
    recommendedOfferId: identifierSchema.nullable(),
    recommendedReason: z.string().min(1),
    priceRange: z
      .object({
        min: z.number().nonnegative(),
        max: z.number().nonnegative(),
      })
      .strict()
      .nullable(),
    offers: z.array(priceOfferSchema),
    dataMode: z.enum(["MANUAL", "LIVE", "HYBRID"]),
    disclosure: z.string().min(1),
    updatedAt: apiDateTimeSchema.nullable(),
  })
  .strict();

const historyPointSchema = z
  .object({
    date: z.iso.date(),
    minimumPrice: z.number().nonnegative(),
    offerCount: z.number().int().nonnegative(),
  })
  .strict();

const historyChangeSchema = z
  .object({
    offerId: identifierSchema.nullable(),
    platform: z.string().min(1),
    salePrice: z.number().nonnegative(),
    finalPrice: z.number().nonnegative(),
    stockStatus: z.string().min(1),
    recordSource: z.string().min(1),
    recordedAt: apiDateTimeSchema,
  })
  .strict();

const historyDataSchema = z
  .object({
    hardwareKey: z.string().min(1),
    range: priceRangeSchema,
    platform: pricePlatformSchema.nullable().optional().default(null),
    points: z.array(historyPointSchema),
    changes: z.array(historyChangeSchema),
    lowestPrice: nullablePriceSchema,
    highestPrice: nullablePriceSchema,
    changePercent: z.number(),
    updatedAt: apiDateTimeSchema,
  })
  .strict();

const componentQuoteSchema = z
  .object({
    hardwareKey: z.string().min(1),
    hardwareName: z.string().min(1),
    internalReferencePrice: z.number().nonnegative(),
    lowestPrice: nullablePriceSchema,
    recommendedPrice: nullablePriceSchema,
    recommendedOfferId: identifierSchema.nullable(),
  })
  .strict();

const buildQuoteDataSchema = z
  .object({
    components: z.array(componentQuoteSchema),
    lowestTotal: z.number().nonnegative(),
    recommendedTotal: z.number().nonnegative(),
    pricedComponentCount: z.number().int().nonnegative(),
    componentCount: z.number().int().nonnegative(),
    complete: z.boolean(),
    disclosure: z.string().min(1),
    updatedAt: apiDateTimeSchema,
  })
  .strict();

const apiEnvelope = <Schema extends z.ZodType>(data: Schema) =>
  z
    .object({
      code: z.literal("OK"),
      message: z.string(),
      data,
      traceId: z.string(),
      timestamp: z.iso.datetime({ offset: true }),
    })
    .strict();

export const priceComparisonResponseSchema = apiEnvelope(comparisonDataSchema);
export const priceHistoryResponseSchema = apiEnvelope(historyDataSchema);
export const buildQuoteResponseSchema = apiEnvelope(buildQuoteDataSchema);

export type PricePlatform = z.infer<typeof pricePlatformSchema>;
export type PriceRange = z.infer<typeof priceRangeSchema>;
export type PriceOffer = z.infer<typeof priceOfferSchema>;
export type PriceComparison = z.infer<typeof comparisonDataSchema>;
export type PriceHistory = z.infer<typeof historyDataSchema>;
export type BuildQuote = z.infer<typeof buildQuoteDataSchema>;
