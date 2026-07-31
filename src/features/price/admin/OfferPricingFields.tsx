"use client";

import type { UpsertOfferInput } from "../domain/adminPrice";
import { shopTypeSchema } from "../domain/adminPrice";
import { pricePlatformSchema } from "../domain/price";
import styles from "./OfferEditor.module.css";

type OfferPricingFieldsProps = {
  readonly finalPrice: number;
  readonly form: UpsertOfferInput;
  readonly onPatch: (patch: Partial<UpsertOfferInput>) => void;
};

const promotionFields = [
  { key: "couponAmount", label: "优惠券" },
  { key: "fullReductionAmount", label: "满减" },
  { key: "memberDiscountAmount", label: "会员优惠" },
  { key: "platformSubsidyAmount", label: "平台补贴" },
  { key: "shippingFee", label: "运费" },
] as const;

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 2,
  }).format(value);

export function OfferPricingFields({ finalPrice, form, onPatch }: OfferPricingFieldsProps) {
  return (
    <>
      <div className={styles["fieldGrid"]}>
        <label>
          <span>平台</span>
          <select
            value={form.platform}
            onChange={(event) =>
              onPatch({ platform: pricePlatformSchema.parse(event.target.value) })
            }
          >
            <option value="JD">京东</option>
            <option value="TAOBAO">淘宝</option>
            <option value="PDD">拼多多</option>
            <option value="TMALL">天猫</option>
            <option value="SUNING">苏宁</option>
            <option value="AMAZON">Amazon</option>
          </select>
        </label>
        <label>
          <span>商家名称</span>
          <input
            required
            value={form.seller}
            onChange={(event) => onPatch({ seller: event.target.value })}
          />
        </label>
        <label>
          <span>店铺类型</span>
          <select
            value={form.shopType}
            onChange={(event) => onPatch({ shopType: shopTypeSchema.parse(event.target.value) })}
          >
            <option value="SELF_OPERATED">平台自营</option>
            <option value="BRAND_STORE">品牌旗舰店</option>
            <option value="MARKETPLACE">第三方店铺</option>
          </select>
        </label>
        <label>
          <span>标价</span>
          <input
            min="0"
            required
            step="0.01"
            type="number"
            value={form.salePrice}
            onChange={(event) => onPatch({ salePrice: Number(event.target.value) || 0 })}
          />
        </label>
      </div>

      <div className={styles["promotionGrid"]}>
        {promotionFields.map((field) => (
          <label key={field.key}>
            <span>{field.label}</span>
            <input
              min="0"
              step="0.01"
              type="number"
              value={form[field.key]}
              onChange={(event) => onPatch({ [field.key]: Number(event.target.value) || 0 })}
            />
          </label>
        ))}
      </div>

      <div className={styles["finalPricePreview"]}>
        <span>预计到手价</span>
        <strong>{formatMoney(finalPrice)}</strong>
        <small>以保存后服务端计算结果为准</small>
      </div>
    </>
  );
}
