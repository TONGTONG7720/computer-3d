import { describe, expect, it } from "vitest";
import {
  getOfferRedirectUrl,
  parseBuildQuote,
  parsePriceComparison,
  parsePriceHistory,
} from "./PriceApiClient";

const validOffer = {
  id: 41,
  platform: "JD",
  platformLabel: "京东",
  seller: "京东自营",
  shopType: "SELF_OPERATED",
  salePrice: 22999,
  discount: 700,
  shipping: 0,
  finalPrice: 22299,
  rating: 4.9,
  salesCount: 428,
  trustScore: 96,
  rankingScore: 91.8,
  deliveryScore: 88,
  deliveryNote: "京东物流 · 次日达（人工核验）",
  matchConfidence: 0.98,
  stale: false,
  tags: ["自营", "低价"],
  redirectPath: "/api/price-intelligence/offers/41/go",
  recordSource: "MANUAL_DEMO",
};

const validComparison = {
  code: "OK",
  message: "success",
  data: {
    hardwareKey: "gpu-nvidia-rtx5090",
    hardwareName: "NVIDIA GeForce RTX 5090",
    internalReferencePrice: 23999,
    lowestPrice: 22299,
    lowestOfferId: 41,
    recommendedOfferId: 41,
    recommendedReason: "兼顾价格与商家可靠性",
    priceRange: {
      min: 22299,
      max: 23699,
    },
    offers: [validOffer],
    dataMode: "MANUAL",
    disclosure: "平台报价由人工维护，不代表实时成交价。",
    updatedAt: "2026-07-31T08:30:00",
  },
  traceId: "trace-price",
  timestamp: "2026-07-31T08:30:01Z",
};

describe("PriceApiClient", () => {
  it("parses every build quote field returned by the backend contract", () => {
    const quote = parseBuildQuote({
      code: "OK",
      message: "success",
      data: {
        components: [
          {
            hardwareKey: "gpu-nvidia-rtx5090",
            hardwareName: "NVIDIA GeForce RTX 5090",
            internalReferencePrice: null,
            lowestPrice: 22_599,
            recommendedPrice: 22_699,
            recommendedOfferId: 41,
          },
        ],
        internalTotal: 23_999,
        lowestTotal: 22_599,
        recommendedTotal: 22_699,
        savings: 1_400,
        pricedComponentCount: 1,
        componentCount: 1,
        complete: true,
        disclosure: "V1 为人工维护报价。",
        updatedAt: "2026-08-02T08:30:00",
      },
      traceId: "trace-build-quote",
      timestamp: "2026-08-02T08:30:01Z",
    });

    expect(quote.internalTotal).toBe(23_999);
    expect(quote.savings).toBe(1_400);
    expect(quote.components[0]?.internalReferencePrice).toBeNull();
  });

  it("normalizes omitted nullable quote fields from the backend to null", () => {
    const quote = parseBuildQuote({
      code: "OK",
      message: "success",
      data: {
        components: [
          {
            hardwareKey: "ram-ddr5-64gb",
            hardwareName: "DDR5 64GB",
            internalReferencePrice: 1_499,
          },
        ],
        internalTotal: 1_499,
        lowestTotal: 0,
        recommendedTotal: 0,
        savings: 0,
        pricedComponentCount: 0,
        componentCount: 1,
        complete: false,
        disclosure: "V1 为人工维护报价。",
        updatedAt: "2026-08-02T08:30:00",
      },
      traceId: "trace-build-quote-unpriced",
      timestamp: "2026-08-02T08:30:01Z",
    });

    expect(quote.components[0]).toMatchObject({
      internalReferencePrice: 1_499,
      lowestPrice: null,
      recommendedPrice: null,
      recommendedOfferId: null,
    });
  });

  it("parses a valid public comparison without exposing marketplace URLs", () => {
    const comparison = parsePriceComparison(validComparison);

    expect(comparison.hardwareKey).toBe("gpu-nvidia-rtx5090");
    expect(comparison.offers[0]?.redirectPath).toContain("/offers/41/go");
  });

  it.each([
    ["negative final price", { ...validOffer, finalPrice: -1 }],
    ["rating above five", { ...validOffer, rating: 5.1 }],
    ["confidence above one", { ...validOffer, matchConfidence: 1.01 }],
    ["unsupported platform", { ...validOffer, platform: "UNKNOWN" }],
    ["leaked affiliate URL", { ...validOffer, affiliateUrl: "https://item.jd.com/secret" }],
  ])("rejects %s", (_scenario, offer) => {
    expect(() =>
      parsePriceComparison({
        ...validComparison,
        data: {
          ...validComparison.data,
          offers: [offer],
        },
      }),
    ).toThrow();
  });

  it("accepts an empty comparison while preserving the manual-data disclosure", () => {
    const comparison = parsePriceComparison({
      ...validComparison,
      data: {
        ...validComparison.data,
        lowestPrice: null,
        lowestOfferId: null,
        recommendedOfferId: null,
        priceRange: null,
        offers: [],
      },
    });

    expect(comparison.lowestPrice).toBeNull();
    expect(comparison.dataMode).toBe("MANUAL");
  });

  it("normalizes omitted nullable comparison fields to null", () => {
    const comparison = parsePriceComparison({
      ...validComparison,
      data: {
        hardwareKey: validComparison.data.hardwareKey,
        hardwareName: validComparison.data.hardwareName,
        internalReferencePrice: validComparison.data.internalReferencePrice,
        recommendedReason: validComparison.data.recommendedReason,
        offers: [],
        dataMode: validComparison.data.dataMode,
        disclosure: validComparison.data.disclosure,
      },
    });

    expect(comparison).toMatchObject({
      lowestPrice: null,
      lowestOfferId: null,
      recommendedOfferId: null,
      priceRange: null,
      updatedAt: null,
    });
  });

  it("routes purchase tracking through the configured API path", () => {
    const redirectPath = "/api/price-intelligence/offers/41/go";

    expect(getOfferRedirectUrl(redirectPath, "http://127.0.0.1:3100/backend-api")).toBe(
      "http://127.0.0.1:3100/backend-api/price-intelligence/offers/41/go?source=BUILDER",
    );
    expect(getOfferRedirectUrl(redirectPath, "http://127.0.0.1:8088/api")).toBe(
      "http://127.0.0.1:8088/api/price-intelligence/offers/41/go?source=BUILDER",
    );
  });

  it("parses valid 90-day history points", () => {
    const history = parsePriceHistory({
      code: "OK",
      message: "success",
      data: {
        hardwareKey: "gpu-nvidia-rtx5090",
        range: "90D",
        points: [
          {
            date: "2026-07-30",
            minimumPrice: 22499,
            offerCount: 3,
          },
          {
            date: "2026-07-31",
            minimumPrice: 22299,
            offerCount: 3,
          },
        ],
        changes: [],
        lowestPrice: 22299,
        highestPrice: 22499,
        changePercent: -0.89,
        updatedAt: "2026-07-31T08:30:00",
      },
      traceId: "trace-history",
      timestamp: "2026-07-31T08:30:01Z",
    });

    expect(history.range).toBe("90D");
    expect(history.platform).toBeNull();
    expect(history.points).toHaveLength(2);
  });

  it("rejects history responses without change records", () => {
    expect(() =>
      parsePriceHistory({
        code: "OK",
        message: "success",
        data: {
          hardwareKey: "gpu-nvidia-rtx5090",
          range: "30D",
          points: [],
          lowestPrice: null,
          highestPrice: null,
          changePercent: 0,
          updatedAt: "2026-07-31T08:30:00",
        },
        traceId: "trace-history",
        timestamp: "2026-07-31T08:30:01Z",
      }),
    ).toThrow();
  });

  it("rejects invalid history dates", () => {
    expect(() =>
      parsePriceHistory({
        code: "OK",
        message: "success",
        data: {
          hardwareKey: "gpu-nvidia-rtx5090",
          range: "7D",
          platform: "JD",
          points: [
            {
              date: "2026-02-31",
              minimumPrice: 22299,
              offerCount: 1,
            },
          ],
          changes: [],
          lowestPrice: 22299,
          highestPrice: 22299,
          changePercent: 0,
          updatedAt: "not-a-date",
        },
        traceId: "trace-history",
        timestamp: "2026-07-31T08:30:01Z",
      }),
    ).toThrow();
  });
});
