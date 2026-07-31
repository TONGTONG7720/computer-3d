"use client";

import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import type { AdminProduct, AdminProductPage } from "../domain/adminPrice";
import styles from "./AdminCatalog.module.css";
import controls from "./AdminControls.module.css";

type AdminProductCatalogProps = {
  readonly loading: boolean;
  readonly onPageChange: (page: number) => void;
  readonly onSelect: (productId: number) => void;
  readonly products: AdminProductPage;
  readonly selectedId: number | null;
};

const skeletonKeys = ["catalog-1", "catalog-2", "catalog-3", "catalog-4", "catalog-5"];

const productStatusLabels = {
  ACTIVE: "已发布",
  DRAFT: "草稿",
  DISABLED: "已停用",
} as const satisfies Readonly<Record<AdminProduct["status"], string>>;

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);

const formatUpdatedAt = (value: string): string =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

function ProductRow({
  onSelect,
  product,
  selected,
}: {
  readonly onSelect: () => void;
  readonly product: AdminProduct;
  readonly selected: boolean;
}) {
  const activeOffers = product.offers.filter((offer) => offer.enabled);
  const lowest =
    activeOffers.length > 0 ? Math.min(...activeOffers.map((offer) => offer.finalPrice)) : null;
  const stale = activeOffers.some((offer) => offer.stale);
  const platforms = [...new Set(activeOffers.map((offer) => offer.platform))].join(" · ");

  return (
    <article className={styles["productRow"]} data-selected={selected}>
      <button className={styles["productIdentity"]} onClick={onSelect} type="button">
        <span>{product.category}</span>
        <strong>{product.title}</strong>
        <small>
          {product.brand} / {product.model} · {product.recordSource}
        </small>
      </button>
      <div className={styles["matchCell"]}>
        <strong>{product.hardwareId ? `硬件 #${product.hardwareId}` : "未关联硬件"}</strong>
        <span>
          {Math.round(product.matchConfidence * 100)}% · {product.matchStatus}
        </span>
      </div>
      <div className={styles["offerCell"]}>
        <strong>{activeOffers.length}</strong>
        <span>{platforms || "无报价"}</span>
      </div>
      <div className={styles["priceCell"]}>
        <strong>{lowest === null ? "未报价" : formatMoney(lowest)}</strong>
        {stale ? <span data-warning>过期报价</span> : <span>已校验</span>}
      </div>
      <div className={styles["stateCell"]}>
        <span className={styles["statusBadge"]} data-status={product.status}>
          {productStatusLabels[product.status]}
        </span>
        <small>{formatUpdatedAt(product.updatedAt)}</small>
      </div>
    </article>
  );
}

export function AdminProductCatalog({
  loading,
  onPageChange,
  onSelect,
  products,
  selectedId,
}: AdminProductCatalogProps) {
  return (
    <section className={styles["catalogPanel"]} aria-busy={loading}>
      <div className={styles["tableHeader"]}>
        <span>标准商品</span>
        <span>对应硬件 / 匹配</span>
        <span>平台报价</span>
        <span>最低到手价</span>
        <span>状态 / 更新</span>
      </div>
      <div className={styles["productList"]}>
        {loading && products.items.length === 0
          ? skeletonKeys.map((key) => <div className={styles["skeletonRow"]} key={key} />)
          : products.items.map((product) => (
              <ProductRow
                key={product.id}
                onSelect={() => onSelect(product.id)}
                product={product}
                selected={product.id === selectedId}
              />
            ))}
      </div>
      {!loading && products.items.length === 0 ? (
        <div className={styles["emptyState"]}>
          <PackageSearch size={28} strokeWidth={1.4} />
          <strong>没有匹配的商品</strong>
          <span>调整筛选条件，或创建第一条人工商品记录。</span>
        </div>
      ) : null}
      <footer className={styles["catalogFooter"]}>
        <span>
          第 {products.page} / {Math.max(products.totalPages, 1)} 页 · 共 {products.total} 条
        </span>
        <nav aria-label="商品分页" className={styles["pagination"]}>
          <button
            className={controls["secondaryButton"]}
            disabled={loading || products.page <= 1}
            onClick={() => onPageChange(products.page - 1)}
            type="button"
          >
            <ChevronLeft size={15} />
            上一页
          </button>
          <button
            className={controls["secondaryButton"]}
            disabled={loading || products.page >= products.totalPages}
            onClick={() => onPageChange(products.page + 1)}
            type="button"
          >
            下一页
            <ChevronRight size={15} />
          </button>
        </nav>
      </footer>
    </section>
  );
}
