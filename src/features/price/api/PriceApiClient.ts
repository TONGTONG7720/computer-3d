import type { KyInstance } from "ky";
import { hardwarePlatformApiUrl, hardwarePlatformClient } from "../../builder/api/apiClient";
import type {
  BuildQuote,
  PriceAlert,
  PriceAlertOwner,
  PriceComparison,
  PriceHistory,
  PriceRange,
} from "../domain/price";
import {
  buildQuoteResponseSchema,
  emptyPriceAlertResponseSchema,
  priceAlertListResponseSchema,
  priceAlertOwnerSchema,
  priceAlertResponseSchema,
  priceComparisonResponseSchema,
  priceHistoryResponseSchema,
} from "../domain/price";

const priceAlertOwnerHeader = "X-Price-Alert-Owner";

export const parsePriceComparison = (payload: unknown): PriceComparison =>
  priceComparisonResponseSchema.parse(payload).data;

export const parsePriceHistory = (payload: unknown): PriceHistory =>
  priceHistoryResponseSchema.parse(payload).data;

export const parseBuildQuote = (payload: unknown): BuildQuote =>
  buildQuoteResponseSchema.parse(payload).data;

export const parsePriceAlertOwner = (value: unknown): PriceAlertOwner =>
  priceAlertOwnerSchema.parse(value);

export const getPriceComparison = async (
  hardwareKey: string,
  client: KyInstance = hardwarePlatformClient,
): Promise<PriceComparison> => {
  const payload: unknown = await client
    .get(`price-intelligence/hardware/${encodeURIComponent(hardwareKey)}`)
    .json();
  return parsePriceComparison(payload);
};

export const getPriceHistory = async (
  hardwareKey: string,
  range: PriceRange,
  client: KyInstance = hardwarePlatformClient,
): Promise<PriceHistory> => {
  const payload: unknown = await client
    .get(`price-intelligence/hardware/${encodeURIComponent(hardwareKey)}/history`, {
      searchParams: { range },
    })
    .json();
  return parsePriceHistory(payload);
};

export const getBuildQuote = async (
  hardwareKeys: readonly string[],
  client: KyInstance = hardwarePlatformClient,
): Promise<BuildQuote> => {
  const payload: unknown = await client
    .post("price-intelligence/build/quote", {
      json: { hardwareKeys },
    })
    .json();
  return parseBuildQuote(payload);
};

export const upsertPriceAlert = async (
  hardwareKey: string,
  targetPrice: number,
  owner: PriceAlertOwner,
  client: KyInstance = hardwarePlatformClient,
): Promise<PriceAlert> => {
  const payload: unknown = await client
    .put(`price-intelligence/alerts/${encodeURIComponent(hardwareKey)}`, {
      headers: { [priceAlertOwnerHeader]: owner },
      json: { targetPrice },
    })
    .json();
  return priceAlertResponseSchema.parse(payload).data;
};

export const getPriceAlerts = async (
  owner: PriceAlertOwner,
  client: KyInstance = hardwarePlatformClient,
): Promise<readonly PriceAlert[]> => {
  const payload: unknown = await client
    .get("price-intelligence/alerts", {
      headers: { [priceAlertOwnerHeader]: owner },
    })
    .json();
  return priceAlertListResponseSchema.parse(payload).data;
};

export const deletePriceAlert = async (
  publicId: string,
  owner: PriceAlertOwner,
  client: KyInstance = hardwarePlatformClient,
): Promise<void> => {
  const payload: unknown = await client
    .delete(`price-intelligence/alerts/${encodeURIComponent(publicId)}`, {
      headers: { [priceAlertOwnerHeader]: owner },
    })
    .json();
  emptyPriceAlertResponseSchema.parse(payload);
};

export const getOfferRedirectUrl = (
  redirectPath: string,
  apiUrl: string = hardwarePlatformApiUrl,
  source: "BUILDER" | "DETAIL" | "ADMIN_PREVIEW" = "BUILDER",
): string => {
  const apiBaseUrl = new URL(`${apiUrl.replace(/\/+$/, "")}/`);
  const redirectUrl = new URL(redirectPath, apiBaseUrl.origin);
  const apiPath = apiBaseUrl.pathname.replace(/\/+$/, "");
  if (apiPath && apiPath !== "/" && redirectUrl.pathname.startsWith("/api/")) {
    redirectUrl.pathname = `${apiPath}${redirectUrl.pathname.slice("/api".length)}`;
  }
  redirectUrl.searchParams.set("source", source);
  return redirectUrl.toString();
};
