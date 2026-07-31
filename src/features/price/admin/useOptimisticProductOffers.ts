"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminOffer, AdminProduct } from "../domain/adminPrice";

type OfferOverlay = {
  readonly productId: number | null;
  readonly offers: readonly AdminOffer[];
};

const mergeOffers = (
  persisted: readonly AdminOffer[],
  optimistic: readonly AdminOffer[],
): AdminOffer[] => {
  const byId = new Map(persisted.map((offer) => [offer.id, offer]));
  for (const offer of optimistic) {
    const current = byId.get(offer.id);
    if (current === undefined || offer.version > current.version) {
      byId.set(offer.id, offer);
    }
  }
  return Array.from(byId.values());
};

export function useOptimisticProductOffers(product: AdminProduct | null) {
  const productId = product?.id ?? null;
  const [overlay, setOverlay] = useState<OfferOverlay>({ productId, offers: [] });
  const optimisticOffers = overlay.productId === productId ? overlay.offers : [];

  useEffect(() => {
    setOverlay((current) => {
      if (current.productId !== productId) {
        return { productId, offers: [] };
      }
      const pending = current.offers.filter((offer) => {
        const persisted = product?.offers.find((candidate) => candidate.id === offer.id);
        return persisted === undefined || persisted.version < offer.version;
      });
      return pending.length === current.offers.length ? current : { productId, offers: pending };
    });
  }, [product, productId]);

  const rememberOffer = useCallback(
    (offer: AdminOffer) => {
      setOverlay((current) => {
        const active = current.productId === productId ? current.offers : [];
        return {
          productId,
          offers: [...active.filter((candidate) => candidate.id !== offer.id), offer],
        };
      });
    },
    [productId],
  );

  const productWithOffers = useMemo(
    () => (product ? { ...product, offers: mergeOffers(product.offers, optimisticOffers) } : null),
    [optimisticOffers, product],
  );

  return { productWithOffers, rememberOffer } as const;
}
