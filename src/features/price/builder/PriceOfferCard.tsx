"use client";

import { ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";
import { getOfferRedirectUrl } from "../api/PriceApiClient";
import type { PriceOffer } from "../domain/price";
import styles from "./PriceOfferCard.module.css";
import { formatPriceMoney } from "./priceFormat";

type PriceOfferCardProps = {
  readonly lowestOfferId: number | null;
  readonly offer: PriceOffer;
  readonly recommendedOfferId: number | null;
};

export function PriceOfferCard({ lowestOfferId, offer, recommendedOfferId }: PriceOfferCardProps) {
  const isLowest = offer.id === lowestOfferId;
  const isRecommended = offer.id === recommendedOfferId;

  return (
    <article
      className={styles["offerCard"]}
      data-recommended={isRecommended}
      data-stale={offer.stale}
    >
      <div className={styles["offerPlatform"]}>
        <span>{offer.platformLabel}</span>
        <div>
          {isLowest ? <strong>最低价</strong> : null}
          {isRecommended ? <strong data-recommended>可靠推荐</strong> : null}
        </div>
      </div>
      <div className={styles["offerSeller"]}>
        <strong>{offer.seller}</strong>
        <span>
          {offer.shopType === "SELF_OPERATED" ? "平台自营" : "平台商家"} · 评分{" "}
          {offer.rating.toFixed(1)}
        </span>
        <small>
          {offer.shipping === 0 ? "免运费" : `运费 ${formatPriceMoney(offer.shipping)}`} · 销量{" "}
          {offer.salesCount.toLocaleString("zh-CN")}
        </small>
      </div>
      <div className={styles["offerTrust"]}>
        {offer.stale ? <TriangleAlert size={14} /> : <ShieldCheck size={14} />}
        <span>{offer.stale ? "数据可能过期" : `可信分 ${offer.trustScore.toFixed(0)}`}</span>
      </div>
      <div className={styles["offerPrice"]}>
        {offer.discount > 0 ? <small>已优惠 {formatPriceMoney(offer.discount)}</small> : null}
        <strong>{formatPriceMoney(offer.finalPrice)}</strong>
      </div>
      <a
        aria-label={`前往${offer.platformLabel}购买`}
        className={styles["purchaseButton"]}
        href={getOfferRedirectUrl(offer.redirectPath)}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span>前往购买</span>
        <ExternalLink size={14} strokeWidth={1.7} />
      </a>
    </article>
  );
}
