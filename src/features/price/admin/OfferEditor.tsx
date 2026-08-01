"use client";

import { Check, ChevronLeft, Save } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { createAdminOffer, updateAdminOffer } from "../api/AdminPriceApiClient";
import type { AdminOffer, UpsertOfferInput } from "../domain/adminPrice";
import controls from "./AdminControls.module.css";
import styles from "./OfferEditor.module.css";
import { OfferPricingFields } from "./OfferPricingFields";
import { OfferTrustFields } from "./OfferTrustFields";

type OfferEditorProps = {
  readonly adminKey: string;
  readonly offer: AdminOffer | null;
  readonly productId: number;
  readonly onCancel: () => void;
  readonly onSaved: (savedOffer: AdminOffer) => void;
};

const toForm = (offer: AdminOffer | null): UpsertOfferInput => ({
  platform: offer?.platform === "INTERNAL" ? "JD" : (offer?.platform ?? "JD"),
  seller: offer?.seller ?? "",
  shopType:
    offer?.shopType === "OTHER" || offer?.shopType === "INTERNAL"
      ? "MARKETPLACE"
      : (offer?.shopType ?? "SELF_OPERATED"),
  salePrice: offer?.salePrice ?? 0,
  couponAmount: offer?.couponAmount ?? 0,
  fullReductionAmount: offer?.fullReductionAmount ?? 0,
  memberDiscountAmount: offer?.memberDiscountAmount ?? 0,
  platformSubsidyAmount: offer?.platformSubsidyAmount ?? 0,
  shippingFee: offer?.shippingFee ?? 0,
  salesCount: offer?.salesCount ?? 0,
  rating: offer?.rating ?? 4.8,
  sellerScore: offer?.sellerScore ?? 90,
  deliveryScore: offer?.deliveryScore ?? 70,
  deliveryNote: offer?.deliveryNote ?? "",
  currency: offer?.currency ?? "CNY",
  stockStatus: offer?.stockStatus ?? "IN_STOCK",
  productUrl: offer?.productUrl ?? "",
  affiliateUrl: offer?.affiliateUrl ?? "",
  enabled: offer?.enabled ?? true,
  reviewed: offer?.reviewed ?? false,
  ...(offer ? { version: offer.version } : {}),
});

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "报价保存失败，请检查字段后重试。";

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
      const savedOffer = offer
        ? await updateAdminOffer(adminKey, offer.id, form)
        : await createAdminOffer(adminKey, productId, form);
      onSaved(savedOffer);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const patchForm = (patch: Partial<UpsertOfferInput>) =>
    setForm((current) => ({ ...current, ...patch }));

  return (
    <form className={styles["editorForm"]} onSubmit={submit}>
      <header className={styles["subEditorHeader"]}>
        <button
          aria-label="返回商品编辑"
          className={controls["iconButton"]}
          onClick={onCancel}
          type="button"
        >
          <ChevronLeft size={18} strokeWidth={1.7} />
        </button>
        <div>
          <strong>{offer ? "编辑平台报价" : "新增平台报价"}</strong>
          <span>优惠金额将由后端再次校验</span>
        </div>
      </header>
      <OfferPricingFields finalPrice={finalPrice} form={form} onPatch={patchForm} />
      <OfferTrustFields form={form} onPatch={patchForm} />
      {error ? (
        <p className={styles["inlineError"]} role="alert">
          {error}
        </p>
      ) : null}
      <button className={controls["primaryButton"]} disabled={saving} type="submit">
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
