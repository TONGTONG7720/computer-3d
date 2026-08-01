import { parseHardwareId } from "@/features/builder/domain/hardware";
import type { PriceComparison, PriceHistory } from "../domain/price";

export const gpu = {
  id: parseHardwareId("gpu-nvidia-rtx5090"),
  name: "NVIDIA GeForce RTX 5090",
  brand: "NVIDIA",
  category: "gpu",
  price: 23999,
  performance: 100,
  power: 575,
  modelUrl: "/models/rtx5090.glb",
  modelVariant: "rtx5090",
  vram: 32,
  length: 336,
} as const;

export const nextGpu = {
  ...gpu,
  id: parseHardwareId("gpu-nvidia-rtx5080"),
  name: "NVIDIA GeForce RTX 5080",
};

export const cpu = {
  id: parseHardwareId("cpu-intel-i9-14900k"),
  name: "Intel Core i9-14900K",
  brand: "Intel",
  category: "cpu",
  price: 4399,
  performance: 96,
  power: 253,
  modelUrl: "/models/i9-14900k.glb",
  modelVariant: "i9-14900k",
  socket: "LGA1700",
  cores: 24,
  threads: 32,
  tdp: 253,
} as const;

export const comparison: PriceComparison = {
  hardwareKey: "gpu-nvidia-rtx5090",
  hardwareName: "NVIDIA GeForce RTX 5090",
  internalReferencePrice: 23999,
  lowestPrice: 21999,
  lowestOfferId: 1,
  recommendedOfferId: 2,
  recommendedReason: "京东自营综合可信度更高",
  priceRange: { min: 21999, max: 22699 },
  offers: [
    {
      id: 1,
      platform: "PDD",
      platformLabel: "拼多多",
      seller: "显卡严选店",
      shopType: "MARKETPLACE",
      salePrice: 21999,
      discount: 0,
      shipping: 0,
      finalPrice: 21999,
      rating: 4.6,
      salesCount: 86,
      trustScore: 78,
      rankingScore: 84,
      deliveryScore: 72,
      deliveryNote: "商家发货 · 时效待人工复核",
      matchConfidence: 0.96,
      stale: true,
      tags: ["最低价"],
      redirectPath: "/api/price-intelligence/offers/1/go",
      recordSource: "MANUAL_DEMO",
    },
    {
      id: 2,
      platform: "JD",
      platformLabel: "京东",
      seller: "京东自营",
      shopType: "SELF_OPERATED",
      salePrice: 22999,
      discount: 300,
      shipping: 0,
      finalPrice: 22699,
      rating: 4.9,
      salesCount: 428,
      trustScore: 96,
      rankingScore: 92,
      deliveryScore: 88,
      deliveryNote: "京东物流 · 次日达（人工核验）",
      matchConfidence: 0.98,
      stale: false,
      tags: ["自营"],
      redirectPath: "/api/price-intelligence/offers/2/go",
      recordSource: "MANUAL_DEMO",
    },
  ],
  dataMode: "MANUAL",
  disclosure: "平台报价由人工维护，不代表实时成交价。",
  updatedAt: "2026-07-31T08:30:00",
};

export const history: PriceHistory = {
  hardwareKey: "gpu-nvidia-rtx5090",
  range: "30D",
  platform: null,
  points: [
    { date: "2026-07-30", minimumPrice: 22499, offerCount: 3 },
    { date: "2026-07-31", minimumPrice: 21999, offerCount: 3 },
  ],
  changes: [
    {
      offerId: 2,
      platform: "JD",
      salePrice: 22999,
      finalPrice: 21999,
      stockStatus: "IN_STOCK",
      recordSource: "MANUAL_DEMO",
      recordedAt: "2026-07-31T08:30:00",
    },
    {
      offerId: 1,
      platform: "PDD",
      salePrice: 22499,
      finalPrice: 22499,
      stockStatus: "IN_STOCK",
      recordSource: "MANUAL_DEMO",
      recordedAt: "2026-07-30T08:30:00",
    },
  ],
  lowestPrice: 21999,
  highestPrice: 22499,
  changePercent: -2.22,
  updatedAt: "2026-07-31T08:30:00",
};

export const deferred = <Value>() => {
  let resolveValue: ((value: Value) => void) | null = null;
  let rejectValue: ((reason?: unknown) => void) | null = null;
  const promise = new Promise<Value>((resolve, reject) => {
    resolveValue = resolve;
    rejectValue = reject;
  });
  return {
    promise,
    reject(reason?: unknown) {
      if (rejectValue === null) {
        throw new Error("Deferred promise is not initialized");
      }
      rejectValue(reason);
    },
    resolve(value: Value) {
      if (resolveValue === null) {
        throw new Error("Deferred promise is not initialized");
      }
      resolveValue(value);
    },
  };
};
