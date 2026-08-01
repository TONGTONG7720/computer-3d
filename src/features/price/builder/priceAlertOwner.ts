import { type PriceAlertOwner, priceAlertOwnerSchema } from "../domain/price";

const priceAlertOwnerStorageKey = "pc-lab-price-alert-owner-v1";

export function getOrCreatePriceAlertOwner(): PriceAlertOwner | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedOwner = priceAlertOwnerSchema.safeParse(
      window.localStorage.getItem(priceAlertOwnerStorageKey),
    );
    if (storedOwner.success) {
      return storedOwner.data;
    }

    const generatedOwner = priceAlertOwnerSchema.safeParse(window.crypto.randomUUID());
    if (!generatedOwner.success) {
      return null;
    }
    window.localStorage.setItem(priceAlertOwnerStorageKey, generatedOwner.data);
    return generatedOwner.data;
  } catch {
    return null;
  }
}
