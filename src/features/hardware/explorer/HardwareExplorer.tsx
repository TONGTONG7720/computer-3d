"use client";

import {
  Database,
  Filter,
  LoaderCircle,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  fetchHardwarePage,
  type HardwarePage,
  type HardwareSearchCategory,
  type HardwareSearchFilters,
  type HardwareSearchSort,
  hardwareSearchCategories,
} from "@/features/builder/api/HardwareApiClient";
import {
  type HardwareSearchDraft,
  mergeHardwareSearchDraft,
  readHardwareSearch,
  writeHardwareSearch,
} from "./explorerSearch";
import styles from "./HardwareExplorer.module.css";
import { HardwareResultRow } from "./HardwareResultRow";

const categoryLabels = {
  CPU: "CPU",
  GPU: "GPU",
  MOTHERBOARD: "主板",
  RAM: "内存",
  SSD: "存储",
  COOLING: "散热",
  PSU: "电源",
  CASE: "机箱",
} as const satisfies Readonly<Record<HardwareSearchCategory, string>>;

const sortLabels = {
  relevance: "智能相关度",
  performance_desc: "性能优先",
  price_asc: "价格从低到高",
  price_desc: "价格从高到低",
  popularity_desc: "热度优先",
  newest: "最新录入",
} as const satisfies Readonly<Record<HardwareSearchSort, string>>;

type DraftFilters = HardwareSearchDraft;

const emptyPage: HardwarePage = { page: 1, size: 24, total: 0, pages: 0, items: [] };

const toDraft = (filters: HardwareSearchFilters): DraftFilters => ({
  keyword: filters.keyword ?? "",
  brand: filters.brands?.[0] ?? "",
  minPrice: filters.minPrice === undefined ? "" : String(filters.minPrice),
  maxPrice: filters.maxPrice === undefined ? "" : String(filters.maxPrice),
  minPerformance: filters.minPerformance === undefined ? "" : String(filters.minPerformance),
  maxPower: filters.maxPower === undefined ? "" : String(filters.maxPower),
});

type FilterControlsProps = {
  readonly category?: HardwareSearchCategory | undefined;
  readonly draft: DraftFilters;
  readonly prefix: string;
  readonly onCategoryChange?: (category: HardwareSearchCategory | undefined) => void;
  readonly onChange: (draft: DraftFilters) => void;
  readonly onReset: () => void;
};

function FilterControls({
  category,
  draft,
  onCategoryChange,
  onChange,
  onReset,
  prefix,
}: FilterControlsProps) {
  const update = (key: keyof DraftFilters, value: string): void => {
    onChange({ ...draft, [key]: value });
  };
  return (
    <div className={styles["filterFields"]}>
      {onCategoryChange ? (
        <label htmlFor={`${prefix}-category`}>
          <span>组件分类</span>
          <select
            id={`${prefix}-category`}
            onChange={(event) =>
              onCategoryChange(
                event.target.value === ""
                  ? undefined
                  : (event.target.value as HardwareSearchCategory),
              )
            }
            value={category ?? ""}
          >
            <option value="">全部组件</option>
            {hardwareSearchCategories.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label htmlFor={`${prefix}-brand`}>
        <span>品牌</span>
        <input
          id={`${prefix}-brand`}
          onChange={(event) => update("brand", event.target.value)}
          placeholder="Intel / NVIDIA / AMD"
          value={draft.brand}
        />
      </label>
      <div className={styles["fieldPair"]}>
        <label htmlFor={`${prefix}-min-price`}>
          <span>最低价格</span>
          <input
            id={`${prefix}-min-price`}
            inputMode="numeric"
            min={0}
            onChange={(event) => update("minPrice", event.target.value)}
            placeholder="0"
            type="number"
            value={draft.minPrice}
          />
        </label>
        <label htmlFor={`${prefix}-max-price`}>
          <span>最高价格</span>
          <input
            id={`${prefix}-max-price`}
            inputMode="numeric"
            min={0}
            onChange={(event) => update("maxPrice", event.target.value)}
            placeholder="不限"
            type="number"
            value={draft.maxPrice}
          />
        </label>
      </div>
      <label htmlFor={`${prefix}-performance`}>
        <span>最低性能分</span>
        <input
          id={`${prefix}-performance`}
          max={100}
          min={0}
          onChange={(event) => update("minPerformance", event.target.value)}
          placeholder="0 — 100"
          type="number"
          value={draft.minPerformance}
        />
      </label>
      <label htmlFor={`${prefix}-power`}>
        <span>最大功耗 / W</span>
        <input
          id={`${prefix}-power`}
          min={0}
          onChange={(event) => update("maxPower", event.target.value)}
          placeholder="不限"
          type="number"
          value={draft.maxPower}
        />
      </label>
      <button className={styles["resetButton"]} onClick={onReset} type="button">
        <X aria-hidden="true" size={14} />
        清除筛选
      </button>
    </div>
  );
}

export function HardwareExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const filters = useMemo(
    () => readHardwareSearch(new URLSearchParams(queryString)),
    [queryString],
  );
  const [draft, setDraft] = useState<DraftFilters>(() => toDraft(filters));
  const [page, setPage] = useState<HardwarePage>(emptyPage);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [retryRevision, setRetryRevision] = useState(0);

  useEffect(() => {
    setDraft(toDraft(filters));
  }, [filters]);

  useEffect(() => {
    void retryRevision;
    let active = true;
    setStatus("loading");
    setError("");
    void fetchHardwarePage(filters)
      .then((result) => {
        if (active) {
          setPage(result);
          setStatus("ready");
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setStatus("error");
          setError(caught instanceof Error ? caught.message : "无法读取硬件数据");
        }
      });
    return () => {
      active = false;
    };
  }, [filters, retryRevision]);

  const navigate = (next: HardwareSearchFilters): void => {
    const params = writeHardwareSearch(next);
    router.push(params.size > 0 ? `/hardware?${params.toString()}` : "/hardware");
  };

  const applyDraft = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    navigate({ ...mergeHardwareSearchDraft(filters, draft), page: 1 });
  };

  const selectCategory = (category: HardwareSearchCategory | undefined): void => {
    const merged = mergeHardwareSearchDraft(filters, draft);
    if (category) {
      navigate({ ...merged, category, page: 1 });
      return;
    }
    const { category: _category, ...rest } = merged;
    navigate({ ...rest, page: 1 });
  };

  const reset = (): void => navigate({ page: 1, size: 24, sort: "relevance" });
  const activeFilterCount = [
    filters.category,
    filters.brands?.length,
    filters.minPrice,
    filters.maxPrice,
    filters.minPerformance,
    filters.maxPower,
  ].filter((value) => value !== undefined && value !== 0).length;

  return (
    <main className={styles["page"]} data-ui-version="v3">
      <header className={styles["header"]}>
        <Link aria-label="返回 PC Builder" className={styles["brand"]} href="/builder">
          <span aria-hidden="true">
            <Database size={18} />
          </span>
          <strong>PC LAB</strong>
          <small>HARDWARE INTELLIGENCE</small>
        </Link>
        <nav aria-label="主导航">
          <Link href="/builder">Builder</Link>
          <Link aria-current="page" href="/hardware">
            Hardware
          </Link>
        </nav>
        <span className={styles["sourceBadge"]}>MYSQL · INTERNAL DATA</span>
      </header>

      <div className={styles["shell"]}>
        <aside className={styles["filterRail"]}>
          <div className={styles["railTitle"]}>
            <span>
              <SlidersHorizontal size={15} />
              FILTERS
            </span>
            {activeFilterCount > 0 ? <b>{activeFilterCount}</b> : null}
          </div>
          <fieldset aria-label="硬件分类" className={styles["categories"]}>
            <button
              aria-pressed={filters.category === undefined}
              onClick={() => selectCategory(undefined)}
              type="button"
            >
              全部组件
            </button>
            {hardwareSearchCategories.map((category) => (
              <button
                aria-pressed={filters.category === category}
                key={category}
                onClick={() => selectCategory(category)}
                type="button"
              >
                {categoryLabels[category]}
              </button>
            ))}
          </fieldset>
          <form onSubmit={applyDraft}>
            <FilterControls draft={draft} onChange={setDraft} onReset={reset} prefix="desktop" />
            <button className={styles["applyButton"]} type="submit">
              应用筛选
            </button>
          </form>
        </aside>

        <section className={styles["results"]}>
          <div className={styles["titleRow"]}>
            <span>
              <small>HARDWARE EXPLORER</small>
              <h1>硬件技术数据库</h1>
              <p>规格、工作负载评分、功耗与 3D 资源状态来自 PC LAB 内部数据中心。</p>
            </span>
            <strong data-numeric="true">{status === "ready" ? page.total : "—"} RECORDS</strong>
          </div>

          <details className={styles["mobileFilters"]}>
            <summary>
              <Filter size={15} />
              筛选条件 <b>{activeFilterCount}</b>
            </summary>
            <form onSubmit={applyDraft}>
              <FilterControls
                category={filters.category}
                draft={draft}
                onCategoryChange={selectCategory}
                onChange={setDraft}
                onReset={reset}
                prefix="mobile"
              />
              <button className={styles["applyButton"]} type="submit">
                应用筛选
              </button>
            </form>
          </details>

          <form className={styles["queryBar"]} onSubmit={applyDraft}>
            <label>
              <Search aria-hidden="true" size={16} />
              <input
                aria-label="搜索硬件"
                onChange={(event) => setDraft({ ...draft, keyword: event.target.value })}
                placeholder="搜索型号，如 RTX 5090"
                value={draft.keyword}
              />
            </label>
            <select
              aria-label="排序"
              onChange={(event) =>
                navigate({
                  ...mergeHardwareSearchDraft(filters, draft),
                  sort: event.target.value as HardwareSearchSort,
                  page: 1,
                })
              }
              value={filters.sort}
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button type="submit">
              <Search size={15} />
              搜索
            </button>
          </form>

          {status === "loading" ? (
            <div aria-live="polite" className={styles["loadingState"]}>
              <LoaderCircle className={styles["spinner"]} size={20} />
              正在读取硬件规格与性能档案
              {[0, 1, 2, 3].map((item) => (
                <span aria-hidden="true" key={item} />
              ))}
            </div>
          ) : null}

          {status === "error" ? (
            <div className={styles["statePanel"]} role="alert">
              <TriangleAlert size={22} />
              <span>
                <strong>硬件数据中心暂不可用</strong>
                <small>{error}</small>
              </span>
              <button onClick={() => setRetryRevision((value) => value + 1)} type="button">
                <RefreshCcw size={14} />
                重新连接
              </button>
            </div>
          ) : null}

          {status === "ready" && page.items.length === 0 ? (
            <div className={styles["statePanel"]}>
              <Search size={22} />
              <span>
                <strong>没有匹配的硬件记录</strong>
                <small>降低性能门槛或清除价格、功耗限制后重试。</small>
              </span>
              <button onClick={reset} type="button">
                <X size={14} />
                清除筛选
              </button>
            </div>
          ) : null}

          {status === "ready" && page.items.length > 0 ? (
            <div className={styles["resultList"]}>
              {page.items.map((hardware) => (
                <HardwareResultRow hardware={hardware} key={hardware.id} />
              ))}
            </div>
          ) : null}

          {status === "ready" && page.pages > 1 ? (
            <nav aria-label="硬件结果分页" className={styles["pagination"]}>
              <button
                disabled={page.page <= 1}
                onClick={() => navigate({ ...filters, page: page.page - 1 })}
                type="button"
              >
                上一页
              </button>
              <span data-numeric="true">
                {page.page} / {page.pages}
              </span>
              <button
                disabled={page.page >= page.pages}
                onClick={() => navigate({ ...filters, page: page.page + 1 })}
                type="button"
              >
                下一页
              </button>
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  );
}
