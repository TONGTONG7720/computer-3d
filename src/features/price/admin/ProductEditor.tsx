"use client";

import { BadgeCheck, Link2, Plus, Save, Trash2, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  createAdminProduct,
  deleteAdminProduct,
  disableAdminOffer,
  previewProductMatch,
  updateAdminProduct,
} from "../api/AdminPriceApiClient";
import type {
  AdminOffer,
  AdminProduct,
  MatchPreview,
  UpsertProductInput,
} from "../domain/adminPrice";
import { productStatusSchema } from "../domain/adminPrice";
import styles from "./AdminPriceDashboard.module.css";
import { OfferEditor } from "./OfferEditor";

type ProductEditorProps = {
  readonly adminKey: string;
  readonly product: AdminProduct | null;
  readonly onClose: () => void;
  readonly onChanged: (selectedProductId?: number) => void;
};

const toForm = (product: AdminProduct | null): UpsertProductInput => ({
  title: product?.title ?? "",
  brand: product?.brand ?? "",
  model: product?.model ?? "",
  category: product?.category ?? "GPU",
  imageUrl: product?.imageUrl ?? "",
  description: product?.description ?? "",
  hardwareId: product?.hardwareId ?? null,
  status: product?.status ?? "DRAFT",
  ...(product ? { version: product.version } : {}),
});

const toMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "操作失败，请检查数据后重试。";

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);

export function ProductEditor({ adminKey, product, onClose, onChanged }: ProductEditorProps) {
  const [form, setForm] = useState<UpsertProductInput>(() => toForm(product));
  const [preview, setPreview] = useState<MatchPreview | null>(null);
  const [editingOffer, setEditingOffer] = useState<AdminOffer | null>(null);
  const [offerMode, setOfferMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (offerMode && product) {
    return (
      <OfferEditor
        adminKey={adminKey}
        offer={editingOffer}
        productId={product.id}
        onCancel={() => setOfferMode(false)}
        onSaved={() => onChanged(product.id)}
      />
    );
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = product
        ? await updateAdminProduct(adminKey, product.id, form)
        : await createAdminProduct(adminKey, form);
      onChanged(saved.id);
    } catch (caught) {
      setError(toMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const runMatchPreview = async () => {
    if (form.hardwareId === null) {
      setError("请先填写硬件数据库 ID。");
      return;
    }
    setError("");
    try {
      setPreview(
        await previewProductMatch(adminKey, {
          title: form.title,
          brand: form.brand,
          model: form.model,
          category: form.category,
          hardwareId: form.hardwareId,
        }),
      );
    } catch (caught) {
      setError(toMessage(caught));
    }
  };

  const removeProduct = async () => {
    if (!product || !window.confirm(`停用商品“${product.title}”？`)) {
      return;
    }
    setSaving(true);
    try {
      await deleteAdminProduct(adminKey, product.id);
      onChanged();
      onClose();
    } catch (caught) {
      setError(toMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const removeOffer = async (offerId: number) => {
    if (!window.confirm("停用这条报价？历史价格仍会保留。")) {
      return;
    }
    try {
      await disableAdminOffer(adminKey, offerId);
      if (product) {
        onChanged(product.id);
      }
    } catch (caught) {
      setError(toMessage(caught));
    }
  };

  return (
    <form className={styles["editorForm"]} onSubmit={submit}>
      <div className={styles["drawerHeader"]}>
        <div>
          <span>{product ? product.productKey : "NEW PRODUCT"}</span>
          <h2>{product ? "编辑商品" : "创建人工商品"}</h2>
        </div>
        <button
          aria-label="关闭编辑器"
          className={styles["iconButton"]}
          onClick={onClose}
          type="button"
        >
          <X size={18} />
        </button>
      </div>

      <div className={styles["fieldGrid"]}>
        <label className={styles["spanTwo"]}>
          <span>商品标题</span>
          <input
            required
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
        </label>
        <label>
          <span>品牌</span>
          <input
            required
            value={form.brand}
            onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
          />
        </label>
        <label>
          <span>标准型号</span>
          <input
            required
            value={form.model}
            onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}
          />
        </label>
        <label>
          <span>分类</span>
          <select
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
          >
            {["CPU", "GPU", "MOTHERBOARD", "RAM", "SSD", "HDD", "COOLING", "PSU", "CASE"].map(
              (category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          <span>发布状态</span>
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: productStatusSchema.parse(event.target.value),
              }))
            }
          >
            <option value="DRAFT">草稿</option>
            <option value="ACTIVE">已发布</option>
            <option value="DISABLED">已停用</option>
          </select>
        </label>
      </div>

      <label className={styles["wideField"]}>
        <span>图片地址</span>
        <input
          placeholder="https://..."
          type="url"
          value={form.imageUrl}
          onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
        />
      </label>
      <label className={styles["wideField"]}>
        <span>运营备注</span>
        <textarea
          rows={3}
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </label>

      <section className={styles["matchBlock"]}>
        <div className={styles["sectionHeading"]}>
          <div>
            <span>硬件匹配</span>
            <strong>{product?.matchStatus ?? "UNMATCHED"}</strong>
          </div>
          {product?.hardwareId ? (
            <small>
              <Link2 size={13} />
              ID {product.hardwareId}
            </small>
          ) : null}
        </div>
        <div className={styles["matchAction"]}>
          <label>
            <span>硬件数据库 ID</span>
            <input
              min="1"
              type="number"
              value={form.hardwareId ?? ""}
              onChange={(event) => {
                const value = Number(event.target.value);
                setForm((current) => ({
                  ...current,
                  hardwareId: value > 0 ? value : null,
                }));
              }}
            />
          </label>
          <button className={styles["secondaryButton"]} onClick={runMatchPreview} type="button">
            预览匹配
          </button>
        </div>
        {preview ? (
          <div className={styles["matchPreview"]}>
            <div>
              <BadgeCheck size={18} />
              <span>
                <strong>{Math.round(preview.confidence * 100)}%</strong>
                {preview.decision}
              </span>
            </div>
            <p>{preview.explanations.join("；")}</p>
          </div>
        ) : null}
      </section>

      {product ? (
        <section className={styles["offerSection"]}>
          <div className={styles["sectionHeading"]}>
            <div>
              <span>平台报价</span>
              <strong>{product.offers.length} 条</strong>
            </div>
            <button
              className={styles["textButton"]}
              onClick={() => {
                setEditingOffer(null);
                setOfferMode(true);
              }}
              type="button"
            >
              <Plus size={15} />
              新增报价
            </button>
          </div>
          <div className={styles["offerList"]}>
            {product.offers.map((offer) => (
              <article className={styles["offerCard"]} key={offer.id}>
                <button
                  className={styles["offerMain"]}
                  onClick={() => {
                    setEditingOffer(offer);
                    setOfferMode(true);
                  }}
                  type="button"
                >
                  <span>{offer.platform}</span>
                  <strong>{formatMoney(offer.finalPrice)}</strong>
                  <small>{offer.seller}</small>
                </button>
                <span className={styles["offerState"]} data-stale={offer.stale}>
                  {offer.stale ? "过期" : offer.reviewed ? "已审核" : "待审核"}
                </span>
                <button
                  aria-label={`停用 ${offer.seller} 报价`}
                  className={styles["offerDelete"]}
                  onClick={() => void removeOffer(offer.id)}
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              </article>
            ))}
            {product.offers.length === 0 ? (
              <div className={styles["emptyOffers"]}>尚无平台报价</div>
            ) : null}
          </div>
        </section>
      ) : null}

      {error ? (
        <p className={styles["inlineError"]} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles["editorActions"]}>
        {product ? (
          <button
            className={styles["dangerButton"]}
            disabled={saving}
            onClick={() => void removeProduct()}
            type="button"
          >
            <Trash2 size={15} />
            停用商品
          </button>
        ) : null}
        <button className={styles["primaryButton"]} disabled={saving} type="submit">
          <Save size={16} />
          {saving ? "正在保存" : product ? "保存商品" : "创建商品"}
        </button>
      </div>
    </form>
  );
}
