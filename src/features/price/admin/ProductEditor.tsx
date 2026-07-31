"use client";

import { X } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  confirmProductMatch,
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
import controls from "./AdminControls.module.css";
import { AdminPriceHistoryDialog } from "./AdminPriceHistoryDialog";
import { OfferEditor } from "./OfferEditor";
import styles from "./ProductEditor.module.css";
import { ProductEditorActions } from "./ProductEditorActions";
import { ProductIdentityFields } from "./ProductIdentityFields";
import { ProductMatchPanel } from "./ProductMatchPanel";
import { ProductOfferList } from "./ProductOfferList";
import { useOptimisticProductOffers } from "./useOptimisticProductOffers";

type ProductEditorProps = {
  readonly adminKey: string;
  readonly product: AdminProduct | null;
  readonly onClose: () => void;
  readonly onChanged: (selectedProductId?: number) => void;
};

type MatchPreviewState = {
  readonly fingerprint: string;
  readonly value: MatchPreview;
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

const toMatchFingerprint = (form: UpsertProductInput): string =>
  JSON.stringify([form.title, form.brand, form.model, form.category, form.hardwareId]);

export function ProductEditor({ adminKey, product, onClose, onChanged }: ProductEditorProps) {
  const [form, setForm] = useState<UpsertProductInput>(() => toForm(product));
  const [previewState, setPreviewState] = useState<MatchPreviewState | null>(null);
  const [editingOffer, setEditingOffer] = useState<AdminOffer | null>(null);
  const [offerMode, setOfferMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const { productWithOffers, rememberOffer } = useOptimisticProductOffers(product);
  const readOnly = product?.recordSource === "INTERNAL";
  const matchFingerprint = toMatchFingerprint(form);
  const preview = previewState?.fingerprint === matchFingerprint ? previewState.value : null;

  if (offerMode && product && !readOnly) {
    return (
      <OfferEditor
        adminKey={adminKey}
        offer={editingOffer}
        productId={product.id}
        onCancel={() => setOfferMode(false)}
        onSaved={(savedOffer) => {
          rememberOffer(savedOffer);
          setEditingOffer(savedOffer);
          setOfferMode(false);
          onChanged(product.id);
        }}
      />
    );
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = product
        ? await updateAdminProduct(adminKey, product.id, form)
        : await createAdminProduct(adminKey, form);
      setForm((current) => ({ ...current, version: saved.version }));
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
      const value = await previewProductMatch(adminKey, {
        title: form.title,
        brand: form.brand,
        model: form.model,
        category: form.category,
        hardwareId: form.hardwareId,
      });
      setPreviewState({ fingerprint: matchFingerprint, value });
    } catch (caught) {
      setError(toMessage(caught));
    }
  };

  const confirmMatch = async () => {
    if (
      product === null ||
      form.hardwareId === null ||
      preview === null ||
      preview.decision === "REJECTED" ||
      readOnly
    ) {
      return;
    }
    setConfirming(true);
    setError("");
    try {
      const confirmed = await confirmProductMatch(
        adminKey,
        product.id,
        form.hardwareId,
        form.version ?? product.version,
      );
      setForm((current) => ({ ...current, version: confirmed.version }));
      setPreviewState(null);
      onChanged(confirmed.id);
    } catch (caught) {
      setError(toMessage(caught));
    } finally {
      setConfirming(false);
    }
  };

  const removeProduct = async () => {
    if (product === null || readOnly || !window.confirm(`停用商品“${product.title}”？`)) {
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
          <h2>{readOnly ? "内部参考资料" : product ? "编辑商品" : "创建人工商品"}</h2>
        </div>
        <button
          aria-label="关闭编辑器"
          className={controls["iconButton"]}
          onClick={onClose}
          type="button"
        >
          <X size={18} />
        </button>
      </div>

      {readOnly ? (
        <p className={styles["readOnlyNote"]}>内部参考资料由硬件目录维护，此处只读。</p>
      ) : null}

      <ProductIdentityFields
        disabled={readOnly}
        form={form}
        onPatch={(patch) => setForm((current) => ({ ...current, ...patch }))}
      />
      <ProductMatchPanel
        confirming={confirming}
        hardwareId={form.hardwareId}
        onConfirm={() => void confirmMatch()}
        onHardwareIdChange={(hardwareId) => setForm((current) => ({ ...current, hardwareId }))}
        onPreview={() => void runMatchPreview()}
        preview={preview}
        product={product}
        readOnly={readOnly}
      />

      {product ? (
        <ProductOfferList
          onCreate={() => {
            setEditingOffer(null);
            setOfferMode(true);
          }}
          onEdit={(offer) => {
            setEditingOffer(offer);
            setOfferMode(true);
          }}
          onOpenHistory={() => setHistoryOpen(true)}
          onRemove={(offerId) => void removeOffer(offerId)}
          product={productWithOffers ?? product}
          readOnly={readOnly}
        />
      ) : null}

      {error ? (
        <p className={styles["inlineError"]} role="alert">
          {error}
        </p>
      ) : null}

      {!readOnly ? (
        <ProductEditorActions
          editing={product !== null}
          onRemove={() => void removeProduct()}
          saving={saving}
        />
      ) : null}

      {product?.hardwareId ? (
        <AdminPriceHistoryDialog
          hardwareId={product.hardwareId.toString()}
          hardwareName={product.title}
          onClose={() => setHistoryOpen(false)}
          open={historyOpen}
        />
      ) : null}
    </form>
  );
}
