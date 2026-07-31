"use client";

import { ChartNoAxesCombined, Plus, Trash2 } from "lucide-react";
import type { AdminOffer, AdminProduct } from "../domain/adminPrice";
import controls from "./AdminControls.module.css";
import styles from "./ProductOfferList.module.css";

type ProductOfferListProps = {
  readonly onCreate: () => void;
  readonly onEdit: (offer: AdminOffer) => void;
  readonly onOpenHistory: () => void;
  readonly onRemove: (offerId: number) => void;
  readonly product: AdminProduct;
  readonly readOnly: boolean;
};

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);

export function ProductOfferList({
  onCreate,
  onEdit,
  onOpenHistory,
  onRemove,
  product,
  readOnly,
}: ProductOfferListProps) {
  return (
    <section className={styles["offerSection"]}>
      <div className={styles["sectionHeading"]}>
        <div>
          <span>平台报价</span>
          <strong>{product.offers.length} 条</strong>
        </div>
        <div className={styles["sectionActions"]}>
          {product.hardwareId ? (
            <button className={controls["textButton"]} onClick={onOpenHistory} type="button">
              <ChartNoAxesCombined size={15} />
              价格历史
            </button>
          ) : null}
          {!readOnly ? (
            <button className={controls["textButton"]} onClick={onCreate} type="button">
              <Plus size={15} />
              新增报价
            </button>
          ) : null}
        </div>
      </div>
      <div className={styles["offerList"]}>
        {product.offers.map((offer) => {
          const internal = offer.recordSource === "INTERNAL";
          return (
            <article className={styles["offerCard"]} key={offer.id}>
              <button
                className={styles["offerMain"]}
                disabled={internal || readOnly}
                onClick={() => onEdit(offer)}
                title={internal ? "内部参考价由硬件资料维护，此处仅展示" : "编辑平台报价"}
                type="button"
              >
                <span>{offer.platform === "INTERNAL" ? "内部参考价" : offer.platform}</span>
                <strong>{formatMoney(offer.finalPrice)}</strong>
                <small>
                  {offer.seller}
                  {internal ? " · 只读" : ""}
                </small>
              </button>
              <span className={styles["offerState"]} data-stale={offer.stale}>
                {offer.stale ? "过期" : offer.reviewed ? "已审核" : "待审核"}
              </span>
              {!internal && !readOnly ? (
                <button
                  aria-label={`停用 ${offer.seller} 报价`}
                  className={styles["offerDelete"]}
                  onClick={() => onRemove(offer.id)}
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
            </article>
          );
        })}
        {product.offers.length === 0 ? (
          <div className={styles["emptyOffers"]}>尚无平台报价</div>
        ) : null}
      </div>
    </section>
  );
}
