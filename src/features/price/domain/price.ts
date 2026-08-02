import { z } from "zod";

export const pricePlatformSchema = z.enum(["JD", "TAOBAO", "PDD", "TMALL", "AMAZON", "SUNING"]);

export const priceRangeSchema = z.enum(["7D", "30D", "90D"]);
export const apiDateTimeSchema = z.iso.datetime({ local: true });
export const priceAlertOwnerSchema = z.uuid().brand<"PriceAlertOwner">();

const nullablePriceSchema = z.number().nonnegative().nullable().optional().default(null);
const identifierSchema = z.number().int().positive();
const nullableIdentifierSchema = identifierSchema.nullable().optional().default(null);
const nullableDateTimeSchema = apiDateTimeSchema.nullable().optional().default(null);

export const priceOfferSchema = z.strictObject({
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
  deliveryScore: z.number().min(0).max(100),
  deliveryNote: z.string().max(160),
  matchConfidence: z.number().min(0).max(1),
  stale: z.boolean(),
  tags: z.array(z.string().min(1)),
  redirectPath: z.string().startsWith("/api/price-intelligence/offers/"),
  recordSource: z.string().min(1),
});

const comparisonDataSchema = z.strictObject({
  hardwareKey: z.string().min(1),
  hardwareName: z.string().min(1),
  internalReferencePrice: z.number().nonnegative(),
  lowestPrice: nullablePriceSchema,
  lowestOfferId: nullableIdentifierSchema,
  recommendedOfferId: nullableIdentifierSchema,
  recommendedReason: z.string().min(1),
  priceRange: z
    .strictObject({
      min: z.number().nonnegative(),
      max: z.number().nonnegative(),
    })
    .nullable()
    .optional()
    .default(null),
  offers: z.array(priceOfferSchema),
  dataMode: z.enum(["MANUAL", "LIVE", "HYBRID"]),
  disclosure: z.string().min(1),
  updatedAt: nullableDateTimeSchema,
});

const historyPointSchema = z.strictObject({
  date: z.iso.date(),
  minimumPrice: z.number().nonnegative(),
  offerCount: z.number().int().nonnegative(),
});

const historyChangeSchema = z.strictObject({
  offerId: nullableIdentifierSchema,
  platform: z.string().min(1),
  salePrice: z.number().nonnegative(),
  finalPrice: z.number().nonnegative(),
  stockStatus: z.string().min(1),
  recordSource: z.string().min(1),
  recordedAt: apiDateTimeSchema,
});

const historyDataSchema = z.strictObject({
  hardwareKey: z.string().min(1),
  range: priceRangeSchema,
  platform: pricePlatformSchema.nullable().optional().default(null),
  points: z.array(historyPointSchema),
  changes: z.array(historyChangeSchema),
  lowestPrice: nullablePriceSchema,
  highestPrice: nullablePriceSchema,
  changePercent: z.number(),
  updatedAt: apiDateTimeSchema,
});

const componentQuoteSchema = z.strictObject({
  hardwareKey: z.string().min(1),
  hardwareName: z.string().min(1),
  internalReferencePrice: nullablePriceSchema,
  lowestPrice: nullablePriceSchema,
  recommendedPrice: nullablePriceSchema,
  recommendedOfferId: nullableIdentifierSchema,
});

const buildQuoteDataSchema = z.strictObject({
  components: z.array(componentQuoteSchema),
  internalTotal: z.number().nonnegative(),
  lowestTotal: z.number().nonnegative(),
  recommendedTotal: z.number().nonnegative(),
  savings: z.number().nonnegative(),
  pricedComponentCount: z.number().int().nonnegative(),
  componentCount: z.number().int().nonnegative(),
  complete: z.boolean(),
  disclosure: z.string().min(1),
  updatedAt: apiDateTimeSchema,
});

export const priceAlertSchema = z.strictObject({
  publicId: z.uuid(),
  hardwareKey: z.string().min(1),
  hardwareName: z.string().min(1),
  targetPrice: z.number().min(0.01).max(9_999_999.99),
  currentBestPrice: nullablePriceSchema,
  status: z.enum(["ACTIVE", "TRIGGERED"]),
  triggeredAt: nullableDateTimeSchema,
  checkedAt: nullableDateTimeSchema,
  updatedAt: apiDateTimeSchema,
});

const apiEnvelope = <Schema extends z.ZodType>(data: Schema) =>
  z.strictObject({
    code: z.literal("OK"),
    message: z.string(),
    data,
    traceId: z.string(),
    timestamp: z.iso.datetime({ offset: true }),
  });

export const priceComparisonResponseSchema = apiEnvelope(comparisonDataSchema);
export const priceHistoryResponseSchema = apiEnvelope(historyDataSchema);
export const buildQuoteResponseSchema = apiEnvelope(buildQuoteDataSchema);
export const priceAlertResponseSchema = apiEnvelope(priceAlertSchema);
export const priceAlertListResponseSchema = apiEnvelope(z.array(priceAlertSchema));
export const emptyPriceAlertResponseSchema = apiEnvelope(z.null().optional().default(null));

export type PricePlatform = z.infer<typeof pricePlatformSchema>;
export type PriceRange = z.infer<typeof priceRangeSchema>;
export type PriceOffer = z.infer<typeof priceOfferSchema>;
export type PriceComparison = z.infer<typeof comparisonDataSchema>;
export type PriceHistory = z.infer<typeof historyDataSchema>;
export type BuildQuote = z.infer<typeof buildQuoteDataSchema>;
export type PriceAlert = z.infer<typeof priceAlertSchema>;
export type PriceAlertOwner = z.infer<typeof priceAlertOwnerSchema>;
