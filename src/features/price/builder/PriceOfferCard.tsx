"use client";

import { ExternalLink, ShieldCheck, TriangleAlert, Truck } from "lucide-react";
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
  const provenance =
    offer.recordSource === "MANUAL_DEMO"
      ? "人工演示数据"
      : offer.recordSource === "MANUAL"
        ? "人工核验数据"
        : "平台记录";

  return (
    <article
      className={styles["offerCard"]}
      data-recommended={isRecommended}
      data-stale={offer.stale}
    >
      <div className={styles["offerPlatform"]}>
        <span>{offer.platformLabel}</span>
        <div>
          {isLowest ? <strong>最低到手</strong> : null}
          {isRecommended ? <strong data-recommended>推荐购买</strong> : null}
          {offer.stale ? <strong data-pending>待核验</strong> : null}
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
      <div className={styles["offerEvidence"]}>
        <span className={styles["offerTrust"]}>
          {offer.stale ? (
            <TriangleAlert aria-hidden="true" size={14} />
          ) : (
            <ShieldCheck aria-hidden="true" size={14} />
          )}
          {offer.stale ? "报价已过核验时效" : `可信分 ${offer.trustScore.toFixed(0)}`}
        </span>
        <span className={styles["offerLogistics"]}>
          <Truck aria-hidden="true" size={14} />
          {offer.deliveryNote || "物流证据待人工补充"}
        </span>
        <small>
          履约评分 {offer.deliveryScore.toFixed(0)}/100 · {provenance}
        </small>
      </div>
      <div className={styles["offerPrice"]}>
        {offer.discount > 0 ? <small>已优惠 {formatPriceMoney(offer.discount)}</small> : null}
        <strong>{formatPriceMoney(offer.finalPrice)}</strong>
      </div>
      <a
        aria-label={`查看${offer.platformLabel}购买`}
        className={styles["purchaseButton"]}
        href={getOfferRedirectUrl(offer.redirectPath)}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span>查看购买</span>
        <ExternalLink size={14} strokeWidth={1.7} />
      </a>
    </article>
  );
}
