"use client";

import { RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { type FormEvent, useCallback, useRef, useState } from "react";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import type { AdminProductFilters as ProductFilters } from "../api/AdminPriceApiClient";
import controls from "./AdminControls.module.css";
import styles from "./AdminFilters.module.css";

type AdminProductFiltersProps = {
  readonly filters: ProductFilters;
  readonly keyword: string;
  readonly loading: boolean;
  readonly onApply: () => void;
  readonly onFiltersChange: (filters: ProductFilters) => void;
  readonly onKeywordChange: (value: string) => void;
  readonly onRefresh: () => void;
};

type FilterFieldsProps = {
  readonly filters: ProductFilters;
  readonly onChange: (filters: ProductFilters) => void;
};

function FilterFields({ filters, onChange }: FilterFieldsProps) {
  return (
    <div className={styles["filterFields"]}>
      <select
        aria-label="筛选平台"
        value={filters.platform ?? ""}
        onChange={(event) => onChange({ ...filters, platform: event.target.value || undefined })}
      >
        <option value="">全部平台</option>
        <option value="JD">京东</option>
        <option value="TAOBAO">淘宝</option>
        <option value="PDD">拼多多</option>
        <option value="TMALL">天猫</option>
      </select>
      <select
        aria-label="筛选分类"
        value={filters.category ?? ""}
        onChange={(event) => onChange({ ...filters, category: event.target.value || undefined })}
      >
        <option value="">全部分类</option>
        {["CPU", "GPU", "MOTHERBOARD", "RAM", "SSD", "HDD", "COOLING", "PSU", "CASE"].map(
          (category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ),
        )}
      </select>
      <select
        aria-label="筛选状态"
        value={filters.status ?? ""}
        onChange={(event) => onChange({ ...filters, status: event.target.value || undefined })}
      >
        <option value="">全部状态</option>
        <option value="ACTIVE">已发布</option>
        <option value="DRAFT">草稿</option>
        <option value="DISABLED">已停用</option>
      </select>
      <select
        aria-label="筛选匹配状态"
        value={filters.matchStatus ?? ""}
        onChange={(event) => onChange({ ...filters, matchStatus: event.target.value || undefined })}
      >
        <option value="">全部匹配</option>
        <option value="CONFIRMED">已确认</option>
        <option value="REVIEW_REQUIRED">待复核</option>
        <option value="UNMATCHED">未匹配</option>
        <option value="REJECTED">已拒绝</option>
      </select>
    </div>
  );
}

export function AdminProductFilters({
  filters,
  keyword,
  loading,
  onApply,
  onFiltersChange,
  onKeywordChange,
  onRefresh,
}: AdminProductFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  useDialogFocus({
    dialogRef: sheetRef,
    initialFocusRef: closeRef,
    isolationRootRef: sheetRootRef,
    onClose: closeSheet,
    open: sheetOpen,
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply();
    setSheetOpen(false);
  };

  return (
    <>
      <form className={styles["desktopToolbar"]} onSubmit={submit}>
        <label className={styles["searchField"]}>
          <Search size={16} />
          <span className={controls["srOnly"]}>搜索商品</span>
          <input
            placeholder="搜索型号、品牌或商品标题"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
        </label>
        <FilterFields filters={filters} onChange={onFiltersChange} />
        <button className={controls["secondaryButton"]} disabled={loading} type="submit">
          应用筛选
        </button>
        <button
          aria-label="刷新数据"
          className={controls["iconButton"]}
          disabled={loading}
          onClick={onRefresh}
          type="button"
        >
          <RefreshCw size={16} />
        </button>
      </form>

      <div className={styles["mobileToolbar"]}>
        <label className={styles["searchField"]}>
          <Search size={16} />
          <span className={controls["srOnly"]}>搜索商品</span>
          <input
            placeholder="搜索商品"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
        </label>
        <button
          aria-label="筛选商品"
          className={controls["iconButton"]}
          onClick={() => setSheetOpen(true)}
          type="button"
        >
          <SlidersHorizontal size={17} />
        </button>
        <button
          aria-label="刷新数据"
          className={controls["iconButton"]}
          disabled={loading}
          onClick={onRefresh}
          type="button"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {sheetOpen ? (
        <div className={styles["sheetBackdrop"]} ref={sheetRootRef}>
          <section
            aria-label="商品筛选"
            aria-modal="true"
            className={styles["filterSheet"]}
            ref={sheetRef}
            role="dialog"
            tabIndex={-1}
          >
            <header>
              <div>
                <small>CATALOG FILTER</small>
                <strong>筛选商品</strong>
              </div>
              <button
                aria-label="关闭筛选"
                className={controls["iconButton"]}
                onClick={closeSheet}
                ref={closeRef}
                type="button"
              >
                <X size={18} />
              </button>
            </header>
            <form onSubmit={submit}>
              <FilterFields filters={filters} onChange={onFiltersChange} />
              <button className={controls["primaryButton"]} type="submit">
                应用筛选
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
