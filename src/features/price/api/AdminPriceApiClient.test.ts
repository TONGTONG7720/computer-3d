import ky from "ky";
import { describe, expect, it } from "vitest";
import {
  fetchAdminDashboard,
  fetchAdminProducts,
  parseAdminProductPage,
} from "./AdminPriceApiClient";

const validOffer = {
  id: 41,
  productId: 9,
  platform: "JD",
  seller: "京东自营",
  shopType: "SELF_OPERATED",
  salePrice: 22999,
  couponAmount: 700,
  fullReductionAmount: 0,
  memberDiscountAmount: 0,
  platformSubsidyAmount: 0,
  shippingFee: 0,
  finalPrice: 22299,
  salesCount: 428,
  rating: 4.9,
  sellerScore: 96,
  currency: "CNY",
  stockStatus: "IN_STOCK",
  productUrl: "https://item.jd.com/41.html",
  affiliateUrl: "https://item.jd.com/41.html?union=pc-lab",
  recordSource: "MANUAL_DEMO",
  enabled: true,
  reviewed: true,
  version: 1,
  stale: false,
  checkedAt: "2026-07-31T08:30:00",
};

describe("AdminPriceApiClient", () => {
  it("parses paged product data including private Admin URLs", () => {
    const result = parseAdminProductPage({
      code: "OK",
      message: "success",
      data: {
        page: 1,
        size: 20,
        total: 1,
        totalPages: 1,
        items: [
          {
            id: 9,
            productKey: "manual-jd-rtx5090",
            hardwareId: 2,
            title: "华硕 RTX 5090 OC 32G",
            brand: "ASUS",
            model: "RTX 5090 OC",
            category: "GPU",
            imageUrl: "",
            description: "人工维护演示报价",
            matchConfidence: 0.98,
            matchStatus: "CONFIRMED",
            status: "ACTIVE",
            recordSource: "MANUAL_DEMO",
            version: 1,
            offers: [validOffer],
            updatedAt: "2026-07-31T08:30:00",
          },
        ],
      },
      traceId: "trace-admin",
      timestamp: "2026-07-31T08:30:01Z",
    });

    expect(result.items[0]?.offers[0]?.affiliateUrl).toContain("union");
  });

  it("keeps migrated internal reference prices readable", () => {
    const result = parseAdminProductPage({
      code: "OK",
      message: "success",
      data: {
        page: 1,
        size: 20,
        total: 1,
        totalPages: 1,
        items: [
          {
            id: 10,
            productKey: "internal-rtx5090",
            hardwareId: 2,
            title: "RTX 5090 内部参考价",
            brand: "NVIDIA",
            model: "RTX 5090",
            category: "GPU",
            imageUrl: "",
            description: "由原硬件价格迁移生成",
            matchConfidence: 1,
            matchStatus: "CONFIRMED",
            status: "ACTIVE",
            recordSource: "INTERNAL",
            version: 1,
            offers: [
              {
                ...validOffer,
                id: 42,
                productId: 10,
                platform: "INTERNAL",
                seller: "PC LAB 内部参考价",
                shopType: "OTHER",
                productUrl: "",
                affiliateUrl: "",
                recordSource: "INTERNAL",
              },
            ],
            updatedAt: "2026-07-31T08:30:00",
          },
        ],
      },
      traceId: "trace-internal",
      timestamp: "2026-07-31T08:30:01Z",
    });

    expect(result.items[0]?.offers[0]?.platform).toBe("INTERNAL");
    expect(result.items[0]?.offers[0]?.shopType).toBe("OTHER");
  });

  it("rejects invalid Admin offer ratings before rendering", () => {
    expect(() =>
      parseAdminProductPage({
        code: "OK",
        message: "success",
        data: {
          page: 1,
          size: 20,
          total: 1,
          totalPages: 1,
          items: [
            {
              id: 9,
              productKey: "manual-jd-rtx5090",
              hardwareId: 2,
              title: "RTX 5090",
              brand: "ASUS",
              model: "RTX 5090",
              category: "GPU",
              imageUrl: "",
              description: "",
              matchConfidence: 0.98,
              matchStatus: "CONFIRMED",
              status: "ACTIVE",
              recordSource: "MANUAL_DEMO",
              version: 1,
              offers: [{ ...validOffer, rating: 5.5 }],
              updatedAt: "2026-07-31T08:30:00",
            },
          ],
        },
        traceId: "trace-admin",
        timestamp: "2026-07-31T08:30:01Z",
      }),
    ).toThrow();
  });

  it("sends the Admin Key only as a request header", async () => {
    let requestedUrl = "";
    let receivedAdminKey: string | null = null;
    const client = ky.create({
      prefix: "https://pc-lab.test/api",
      fetch: async (input, init) => {
        const request = new Request(input, init);
        requestedUrl = request.url;
        receivedAdminKey = request.headers.get("X-Admin-Key");
        return new Response(
          JSON.stringify({
            code: "OK",
            message: "success",
            data: {
              activeProducts: 3,
              validOffers: 7,
              staleOffers: 1,
              missingCoverage: 2,
              clicksLast24Hours: 14,
              topClickedHardware: [],
              dataMode: "MANUAL",
              generatedAt: "2026-07-31T08:30:00",
            },
            traceId: "trace-dashboard",
            timestamp: "2026-07-31T08:30:01Z",
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      },
    });

    const dashboard = await fetchAdminDashboard("session-secret", client);

    expect(dashboard.activeProducts).toBe(3);
    expect(receivedAdminKey).toBe("session-secret");
    expect(requestedUrl).toBe("https://pc-lab.test/api/admin/price-dashboard");
    expect(requestedUrl).not.toContain("session-secret");
  });

  it("sends pagination, category, and match status filters", async () => {
    let requestedUrl = "";
    const client = ky.create({
      prefix: "https://pc-lab.test/api",
      fetch: async (input, init) => {
        const request = new Request(input, init);
        requestedUrl = request.url;
        return new Response(
          JSON.stringify({
            code: "OK",
            message: "success",
            data: { page: 2, size: 20, total: 28, totalPages: 2, items: [] },
            traceId: "trace-products",
            timestamp: "2026-07-31T08:30:01Z",
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    });
    const filters = {
      category: "GPU",
      matchStatus: "CONFIRMED",
      page: 2,
      size: 20,
    };

    await fetchAdminProducts("session-secret", filters, client);

    expect(requestedUrl).toContain("page=2");
    expect(requestedUrl).toContain("category=GPU");
    expect(requestedUrl).toContain("matchStatus=CONFIRMED");
  });
});
