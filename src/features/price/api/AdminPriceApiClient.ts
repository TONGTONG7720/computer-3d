import type { KyInstance, Options } from "ky";
import { z } from "zod";
import { hardwarePlatformClient } from "../../builder/api/apiClient";
import type {
  AdminDashboard,
  AdminOffer,
  AdminProduct,
  AdminProductPage,
  MatchPreview,
  UpsertOfferInput,
  UpsertProductInput,
} from "../domain/adminPrice";
import {
  adminDashboardSchema,
  adminOfferSchema,
  adminProductPageSchema,
  adminProductSchema,
  matchPreviewSchema,
} from "../domain/adminPrice";

const apiEnvelope = <Schema extends z.ZodType>(data: Schema) =>
  z.object({
    code: z.literal("OK"),
    message: z.string(),
    data,
    traceId: z.string(),
    timestamp: z.iso.datetime({ offset: true }),
  });

const adminHeaders = (adminKey: string): Options => ({
  headers: {
    "X-Admin-Key": adminKey,
  },
});

export const parseAdminProductPage = (payload: unknown): AdminProductPage =>
  apiEnvelope(adminProductPageSchema).parse(payload).data;

const parseAdminProduct = (payload: unknown): AdminProduct =>
  apiEnvelope(adminProductSchema).parse(payload).data;

const parseAdminOffer = (payload: unknown): AdminOffer =>
  apiEnvelope(adminOfferSchema).parse(payload).data;

const parseMatchPreview = (payload: unknown): MatchPreview =>
  apiEnvelope(matchPreviewSchema).parse(payload).data;

const parseAdminDashboard = (payload: unknown): AdminDashboard =>
  apiEnvelope(adminDashboardSchema).parse(payload).data;

export type AdminProductFilters = {
  readonly keyword?: string;
  readonly platform?: string;
  readonly status?: string;
  readonly page?: number;
  readonly size?: number;
};

export const fetchAdminProducts = async (
  adminKey: string,
  filters: AdminProductFilters = {},
  client: KyInstance = hardwarePlatformClient,
): Promise<AdminProductPage> => {
  const payload: unknown = await client
    .get("admin/products", {
      ...adminHeaders(adminKey),
      searchParams: {
        page: filters.page ?? 1,
        size: filters.size ?? 20,
        ...(filters.keyword ? { keyword: filters.keyword } : {}),
        ...(filters.platform ? { platform: filters.platform } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
    })
    .json();
  return parseAdminProductPage(payload);
};

export const fetchAdminDashboard = async (
  adminKey: string,
  client: KyInstance = hardwarePlatformClient,
): Promise<AdminDashboard> => {
  const payload: unknown = await client.get("admin/price-dashboard", adminHeaders(adminKey)).json();
  return parseAdminDashboard(payload);
};

export const createAdminProduct = async (
  adminKey: string,
  input: UpsertProductInput,
  client: KyInstance = hardwarePlatformClient,
): Promise<AdminProduct> => {
  const payload: unknown = await client
    .post("admin/products", { ...adminHeaders(adminKey), json: input })
    .json();
  return parseAdminProduct(payload);
};

export const updateAdminProduct = async (
  adminKey: string,
  productId: number,
  input: UpsertProductInput,
  client: KyInstance = hardwarePlatformClient,
): Promise<AdminProduct> => {
  const payload: unknown = await client
    .put(`admin/products/${productId}`, {
      ...adminHeaders(adminKey),
      json: input,
    })
    .json();
  return parseAdminProduct(payload);
};

export const deleteAdminProduct = async (
  adminKey: string,
  productId: number,
  client: KyInstance = hardwarePlatformClient,
): Promise<void> => {
  await client.delete(`admin/products/${productId}`, adminHeaders(adminKey));
};

export const previewProductMatch = async (
  adminKey: string,
  input: {
    readonly title: string;
    readonly brand: string;
    readonly model: string;
    readonly category: string;
    readonly hardwareId: number;
  },
  client: KyInstance = hardwarePlatformClient,
): Promise<MatchPreview> => {
  const payload: unknown = await client
    .post("admin/products/match-preview", {
      ...adminHeaders(adminKey),
      json: input,
    })
    .json();
  return parseMatchPreview(payload);
};

export const confirmProductMatch = async (
  adminKey: string,
  productId: number,
  hardwareId: number,
  version: number,
  client: KyInstance = hardwarePlatformClient,
): Promise<AdminProduct> => {
  const payload: unknown = await client
    .post(`admin/products/${productId}/match`, {
      ...adminHeaders(adminKey),
      json: { hardwareId, reviewedBy: "PRICE_ADMIN", version },
    })
    .json();
  return parseAdminProduct(payload);
};

export const createAdminOffer = async (
  adminKey: string,
  productId: number,
  input: UpsertOfferInput,
  client: KyInstance = hardwarePlatformClient,
): Promise<AdminOffer> => {
  const payload: unknown = await client
    .post(`admin/products/${productId}/offers`, {
      ...adminHeaders(adminKey),
      json: input,
    })
    .json();
  return parseAdminOffer(payload);
};

export const updateAdminOffer = async (
  adminKey: string,
  offerId: number,
  input: UpsertOfferInput,
  client: KyInstance = hardwarePlatformClient,
): Promise<AdminOffer> => {
  const payload: unknown = await client
    .put(`admin/offers/${offerId}`, {
      ...adminHeaders(adminKey),
      json: input,
    })
    .json();
  return parseAdminOffer(payload);
};

export const disableAdminOffer = async (
  adminKey: string,
  offerId: number,
  client: KyInstance = hardwarePlatformClient,
): Promise<void> => {
  await client.delete(`admin/offers/${offerId}`, adminHeaders(adminKey));
};
