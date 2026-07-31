"use client";

import type { UpsertProductInput } from "../domain/adminPrice";
import { productStatusSchema } from "../domain/adminPrice";
import styles from "./ProductEditor.module.css";

type ProductIdentityFieldsProps = {
  readonly disabled: boolean;
  readonly form: UpsertProductInput;
  readonly onPatch: (patch: Partial<UpsertProductInput>) => void;
};

const categories = [
  "CPU",
  "GPU",
  "MOTHERBOARD",
  "RAM",
  "SSD",
  "HDD",
  "COOLING",
  "PSU",
  "CASE",
] as const;

export function ProductIdentityFields({ disabled, form, onPatch }: ProductIdentityFieldsProps) {
  return (
    <>
      <div className={styles["fieldGrid"]}>
        <label className={styles["spanTwo"]}>
          <span>商品标题</span>
          <input
            disabled={disabled}
            required
            value={form.title}
            onChange={(event) => onPatch({ title: event.target.value })}
          />
        </label>
        <label>
          <span>品牌</span>
          <input
            disabled={disabled}
            required
            value={form.brand}
            onChange={(event) => onPatch({ brand: event.target.value })}
          />
        </label>
        <label>
          <span>标准型号</span>
          <input
            disabled={disabled}
            required
            value={form.model}
            onChange={(event) => onPatch({ model: event.target.value })}
          />
        </label>
        <label>
          <span>分类</span>
          <select
            disabled={disabled}
            value={form.category}
            onChange={(event) => onPatch({ category: event.target.value })}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>发布状态</span>
          <select
            disabled={disabled}
            value={form.status}
            onChange={(event) => onPatch({ status: productStatusSchema.parse(event.target.value) })}
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
          disabled={disabled}
          placeholder="https://..."
          type="url"
          value={form.imageUrl}
          onChange={(event) => onPatch({ imageUrl: event.target.value })}
        />
      </label>
      <label className={styles["wideField"]}>
        <span>运营备注</span>
        <textarea
          disabled={disabled}
          rows={3}
          value={form.description}
          onChange={(event) => onPatch({ description: event.target.value })}
        />
      </label>
    </>
  );
}
