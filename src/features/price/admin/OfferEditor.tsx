"use client";

import { Check, ChevronLeft, Save } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { createAdminOffer, updateAdminOffer } from "../api/AdminPriceApiClient";
import type { AdminOffer, UpsertOfferInput } from "../domain/adminPrice";
import { shopTypeSchema, stockStatusSchema } from "../domain/adminPrice";
import { pricePlatformSchema } from "../domain/price";
import styles from "./AdminPriceDashboard.module.css";

type OfferEditorProps = {
  readonly adminKey: string;
  readonly offer: AdminOffer | null;
  readonly productId: number;
  readonly onCancel: () => void;
  readonly onSaved: () => void;
};

const toForm = (offer: AdminOffer | null): UpsertOfferInput => ({
  platform: offer?.platform ?? "JD",
  seller: offer?.seller ?? "",
  shopType: offer?.shopType ?? "SELF_OPERATED",
  salePrice: offer?.salePrice ?? 0,
  couponAmount: offer?.couponAmount ?? 0,
  fullReductionAmount: offer?.fullReductionAmount ?? 0,
  memberDiscountAmount: offer?.memberDiscountAmount ?? 0,
  platformSubsidyAmount: offer?.platformSubsidyAmount ?? 0,
  shippingFee: offer?.shippingFee ?? 0,
  salesCount: offer?.salesCount ?? 0,
  rating: offer?.rating ?? 4.8,
  sellerScore: offer?.sellerScore ?? 90,
  currency: offer?.currency ?? "CNY",
  stockStatus: offer?.stockStatus ?? "IN_STOCK",
  productUrl: offer?.productUrl ?? "",
  affiliateUrl: offer?.affiliateUrl ?? "",
  enabled: offer?.enabled ?? true,
  reviewed: offer?.reviewed ?? false,
  ...(offer ? { version: offer.version } : {}),
});

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 2,
  }).format(value);

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "报价保存失败，请检查字段后重试。";

const promotionFields = [
  { key: "couponAmount", label: "优惠券" },
  { key: "fullReductionAmount", label: "满减" },
  { key: "memberDiscountAmount", label: "会员优惠" },
  { key: "platformSubsidyAmount", label: "平台补贴" },
  { key: "shippingFee", label: "运费" },
] as const;

export function OfferEditor({ adminKey, offer, productId, onCancel, onSaved }: OfferEditorProps) {
  const [form, setForm] = useState<UpsertOfferInput>(() => toForm(offer));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const finalPrice = useMemo(
    () =>
      Math.max(
        0,
        form.salePrice -
          form.couponAmount -
          form.fullReductionAmount -
          form.memberDiscountAmount -
          form.platformSubsidyAmount +
          form.shippingFee,
      ),
    [form],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (offer) {
        await updateAdminOffer(adminKey, offer.id, form);
      } else {
        await createAdminOffer(adminKey, productId, form);
      }
      onSaved();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const numberField = (
    key:
      | "salePrice"
      | "couponAmount"
      | "fullReductionAmount"
      | "memberDiscountAmount"
      | "platformSubsidyAmount"
      | "shippingFee"
      | "salesCount"
      | "rating"
      | "sellerScore",
    value: string,
  ) => {
    const parsed = Number(value);
    setForm((current) => ({
      ...current,
      [key]: Number.isFinite(parsed) ? parsed : 0,
    }));
  };

  return (
    <form className={styles["editorForm"]} onSubmit={submit}>
      <div className={styles["subEditorHeader"]}>
        <button
          aria-label="返回商品编辑"
          className={styles["iconButton"]}
          onClick={onCancel}
          type="button"
        >
          <ChevronLeft size={18} strokeWidth={1.7} />
        </button>
        <div>
          <strong>{offer ? "编辑平台报价" : "新增平台报价"}</strong>
          <span>优惠金额将由后端再次校验</span>
        </div>
      </div>

      <div className={styles["fieldGrid"]}>
        <label>
          <span>平台</span>
          <select
            value={form.platform}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                platform: pricePlatformSchema.parse(event.target.value),
              }))
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
            onChange={(event) => setForm((current) => ({ ...current, seller: event.target.value }))}
          />
        </label>
        <label>
          <span>店铺类型</span>
          <select
            value={form.shopType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                shopType: shopTypeSchema.parse(event.target.value),
              }))
            }
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
            onChange={(event) => numberField("salePrice", event.target.value)}
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
              onChange={(event) => numberField(field.key, event.target.value)}
            />
          </label>
        ))}
      </div>

      <div className={styles["finalPricePreview"]}>
        <span>预计到手价</span>
        <strong>{formatMoney(finalPrice)}</strong>
        <small>以保存后服务端计算结果为准</small>
      </div>

      <div className={styles["fieldGrid"]}>
        <label>
          <span>销量</span>
          <input
            min="0"
            type="number"
            value={form.salesCount}
            onChange={(event) => numberField("salesCount", event.target.value)}
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
            onChange={(event) => numberField("rating", event.target.value)}
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
            onChange={(event) => numberField("sellerScore", event.target.value)}
          />
        </label>
        <label>
          <span>库存</span>
          <select
            value={form.stockStatus}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                stockStatus: stockStatusSchema.parse(event.target.value),
              }))
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
          onChange={(event) =>
            setForm((current) => ({ ...current, productUrl: event.target.value }))
          }
        />
      </label>
      <label className={styles["wideField"]}>
        <span>联盟链接</span>
        <input
          placeholder="审核通过后用于购买跳转"
          type="url"
          value={form.affiliateUrl}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              affiliateUrl: event.target.value,
            }))
          }
        />
      </label>

      <div className={styles["checkRow"]}>
        <label>
          <input
            checked={form.enabled}
            type="checkbox"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                enabled: event.target.checked,
              }))
            }
          />
          <span>启用报价</span>
        </label>
        <label>
          <input
            checked={form.reviewed}
            type="checkbox"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                reviewed: event.target.checked,
              }))
            }
          />
          <span>已人工审核链接</span>
        </label>
      </div>

      {error ? (
        <p className={styles["inlineError"]} role="alert">
          {error}
        </p>
      ) : null}

      <button className={styles["primaryButton"]} disabled={saving} type="submit">
        {saving ? (
          "正在保存"
        ) : (
          <>
            {offer ? <Save size={16} /> : <Check size={16} />}
            {offer ? "保存报价" : "创建报价"}
          </>
        )}
      </button>
    </form>
  );
}
