"use client";

import type { UpsertOfferInput } from "../domain/adminPrice";
import { stockStatusSchema } from "../domain/adminPrice";
import styles from "./OfferEditor.module.css";

type OfferTrustFieldsProps = {
  readonly form: UpsertOfferInput;
  readonly onPatch: (patch: Partial<UpsertOfferInput>) => void;
};

export function OfferTrustFields({ form, onPatch }: OfferTrustFieldsProps) {
  return (
    <>
      <div className={styles["fieldGrid"]}>
        <label>
          <span>销量</span>
          <input
            min="0"
            type="number"
            value={form.salesCount}
            onChange={(event) => onPatch({ salesCount: Number(event.target.value) || 0 })}
          />
        </label>
        <label>
          <span>商品评分</span>
          <input
            max="5"
            min="0"
            step="0.1"
            type="number"
            value={form.rating}
            onChange={(event) => onPatch({ rating: Number(event.target.value) || 0 })}
          />
        </label>
        <label>
          <span>商家可信分</span>
          <input
            max="100"
            min="0"
            step="0.1"
            type="number"
            value={form.sellerScore}
            onChange={(event) => onPatch({ sellerScore: Number(event.target.value) || 0 })}
          />
        </label>
        <label>
          <span>库存</span>
          <select
            value={form.stockStatus}
            onChange={(event) =>
              onPatch({ stockStatus: stockStatusSchema.parse(event.target.value) })
            }
          >
            <option value="IN_STOCK">有货</option>
            <option value="PREORDER">预售</option>
            <option value="OUT_OF_STOCK">缺货</option>
          </select>
        </label>
      </div>
      <label className={styles["wideField"]}>
        <span>商品链接</span>
        <input
          placeholder="https://..."
          type="url"
          value={form.productUrl}
          onChange={(event) => onPatch({ productUrl: event.target.value })}
        />
      </label>
      <label className={styles["wideField"]}>
        <span>联盟链接</span>
        <input
          placeholder="审核通过后用于购买跳转"
          type="url"
          value={form.affiliateUrl}
          onChange={(event) => onPatch({ affiliateUrl: event.target.value })}
        />
      </label>
      <div className={styles["checkRow"]}>
        <label>
          <input
            checked={form.enabled}
            type="checkbox"
            onChange={(event) => onPatch({ enabled: event.target.checked })}
          />
          <span>启用报价</span>
        </label>
        <label>
          <input
            checked={form.reviewed}
            type="checkbox"
            onChange={(event) => onPatch({ reviewed: event.target.checked })}
          />
          <span>已人工审核链接</span>
        </label>
      </div>
    </>
  );
}
