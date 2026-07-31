import ky from "ky";
import { describe, expect, it } from "vitest";
import { fetchAdminDashboard, parseAdminProductPage } from "./AdminPriceApiClient";

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
});
