"use client";

import { BadgeCheck, Link2 } from "lucide-react";
import type { AdminProduct, MatchPreview } from "../domain/adminPrice";
import controls from "./AdminControls.module.css";
import styles from "./ProductEditor.module.css";

type ProductMatchPanelProps = {
  readonly confirming: boolean;
  readonly hardwareId: number | null;
  readonly onConfirm: () => void;
  readonly onHardwareIdChange: (hardwareId: number | null) => void;
  readonly onPreview: () => void;
  readonly preview: MatchPreview | null;
  readonly product: AdminProduct | null;
  readonly readOnly: boolean;
};

export function ProductMatchPanel({
  confirming,
  hardwareId,
  onConfirm,
  onHardwareIdChange,
  onPreview,
  preview,
  product,
  readOnly,
}: ProductMatchPanelProps) {
  return (
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
            disabled={readOnly}
            min="1"
            type="number"
            value={hardwareId ?? ""}
            onChange={(event) => {
              const value = Number(event.target.value);
              onHardwareIdChange(value > 0 ? value : null);
            }}
          />
        </label>
        <button
          className={controls["secondaryButton"]}
          disabled={readOnly}
          onClick={onPreview}
          type="button"
        >
          <span className={controls["nowrap"]}>预览匹配</span>
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
          {product ? (
            <button
              className={controls["primaryButton"]}
              disabled={confirming || preview.decision === "REJECTED" || readOnly}
              onClick={onConfirm}
              type="button"
            >
              {preview.decision === "REJECTED" ? "无法确认" : confirming ? "正在确认" : "确认匹配"}
            </button>
          ) : (
            <small>先创建商品，再确认该硬件匹配。</small>
          )}
        </div>
      ) : null}
    </section>
  );
}
