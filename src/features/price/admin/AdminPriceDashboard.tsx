"use client";

import {
  ArrowLeft,
  BadgeDollarSign,
  Box,
  Clock3,
  Database,
  KeyRound,
  MousePointerClick,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  type AdminProductFilters,
  fetchAdminDashboard,
  fetchAdminProducts,
} from "../api/AdminPriceApiClient";
import type { AdminDashboard, AdminProductPage } from "../domain/adminPrice";
import styles from "./AdminPriceDashboard.module.css";
import { ProductEditor } from "./ProductEditor";

const SESSION_KEY = "pc-lab-price-admin-key";

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);

const toMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "无法加载价格数据，请检查服务状态。";

const emptyPage: AdminProductPage = {
  page: 1,
  size: 20,
  total: 0,
  totalPages: 0,
  items: [],
};

const skeletonKeys = ["catalog-1", "catalog-2", "catalog-3", "catalog-4", "catalog-5"];

export function AdminPriceDashboard() {
  const [adminKey, setAdminKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [products, setProducts] = useState<AdminProductPage>(emptyPage);
  const [filters, setFilters] = useState<AdminProductFilters>({});
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");

  const load = useCallback(
    async (
      nextFilters: AdminProductFilters = filters,
      nextSelectedId: number | null = selectedId,
    ) => {
      if (!adminKey) {
        return;
      }
      setStatus("loading");
      setError("");
      try {
        const [nextDashboard, nextProducts] = await Promise.all([
          fetchAdminDashboard(adminKey),
          fetchAdminProducts(adminKey, nextFilters),
        ]);
        setDashboard(nextDashboard);
        setProducts(nextProducts);
        setFilters(nextFilters);
        if (
          nextSelectedId !== null &&
          !nextProducts.items.some((product) => product.id === nextSelectedId)
        ) {
          setSelectedId(null);
          setEditorOpen(false);
        }
        setStatus("ready");
      } catch (caught) {
        setError(`无法加载价格数据：${toMessage(caught)}`);
        setStatus("error");
      }
    },
    [adminKey, filters, selectedId],
  );

  useEffect(() => {
    const storedKey = window.sessionStorage.getItem(SESSION_KEY);
    if (storedKey) {
      setAdminKey(storedKey);
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (unlocked && adminKey) {
      void load();
    }
  }, [adminKey, load, unlocked]);

  const unlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = adminKey.trim();
    if (!normalized) {
      return;
    }
    window.sessionStorage.setItem(SESSION_KEY, normalized);
    setAdminKey(normalized);
    setUnlocked(true);
  };

  const lock = () => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
    setAdminKey("");
    setDashboard(null);
    setProducts(emptyPage);
    setEditorOpen(false);
  };

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void load({ ...filters, keyword: keyword.trim() || undefined }, null);
  };

  const selectedProduct = products.items.find((product) => product.id === selectedId) ?? null;

  if (!unlocked) {
    return (
      <main className={styles["accessPage"]}>
        <div aria-hidden="true" className={styles["accessAtmosphere"]} />
        <Link className={styles["backLink"]} href="/">
          <ArrowLeft size={16} />
          返回 3D Builder
        </Link>
        <section className={styles["accessCard"]}>
          <div className={styles["accessIcon"]}>
            <KeyRound size={24} strokeWidth={1.5} />
          </div>
          <span className={styles["eyebrow"]}>PC LAB OPERATIONS</span>
          <h1>价格情报控制台</h1>
          <p>连接人工商品库，维护平台报价、匹配置信度与价格历史。</p>
          <form onSubmit={unlock}>
            <label>
              <span>Admin Key</span>
              <input
                autoComplete="current-password"
                name="admin-key"
                required
                type="password"
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
              />
            </label>
            <button className={styles["primaryButton"]} type="submit">
              <ShieldCheck size={16} />
              进入控制台
            </button>
          </form>
          <small>密钥仅保存在当前浏览器会话，不写入 URL 或本地持久存储。</small>
        </section>
      </main>
    );
  }

  const metrics = [
    {
      label: "活跃商品",
      value: dashboard?.activeProducts ?? 0,
      icon: Database,
      tone: "primary",
    },
    {
      label: "有效报价",
      value: dashboard?.validOffers ?? 0,
      icon: BadgeDollarSign,
      tone: "success",
    },
    {
      label: "过期报价",
      value: dashboard?.staleOffers ?? 0,
      icon: Clock3,
      tone: "warning",
    },
    {
      label: "缺少覆盖",
      value: dashboard?.missingCoverage ?? 0,
      icon: TriangleAlert,
      tone: "danger",
    },
    {
      label: "24H 跳转",
      value: dashboard?.clicksLast24Hours ?? 0,
      icon: MousePointerClick,
      tone: "neutral",
    },
  ] as const;

  return (
    <main className={styles["workspace"]}>
      <header className={styles["workspaceHeader"]}>
        <Link className={styles["brand"]} href="/">
          <span>
            <Box size={18} strokeWidth={1.55} />
          </span>
          <span>
            <strong>PC LAB</strong>
            <small>PRICE INTELLIGENCE</small>
          </span>
        </Link>
        <div className={styles["headerMeta"]}>
          <span className={styles["manualBadge"]}>人工数据</span>
          <button className={styles["sessionButton"]} onClick={lock} type="button">
            <X size={14} />
            结束会话
          </button>
        </div>
      </header>

      <section className={styles["workspaceBody"]}>
        <div className={styles["pageIntro"]}>
          <div>
            <span className={styles["eyebrow"]}>MARKET OPERATIONS</span>
            <h1>价格情报控制台</h1>
            <p>人工审核商品、优惠与购买链接。V1 不调用平台 API，不使用爬虫。</p>
          </div>
          <button
            className={styles["primaryButton"]}
            onClick={() => {
              setCreating(true);
              setSelectedId(null);
              setEditorOpen(true);
            }}
            type="button"
          >
            <Plus size={16} />
            新增商品
          </button>
        </div>

        <div className={styles["metricStrip"]}>
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article data-tone={metric.tone} key={metric.label}>
                <span>
                  <Icon size={16} strokeWidth={1.65} />
                </span>
                <div>
                  <small>{metric.label}</small>
                  <strong>{metric.value}</strong>
                </div>
              </article>
            );
          })}
        </div>

        <form className={styles["toolbar"]} onSubmit={submitFilters}>
          <label className={styles["searchField"]}>
            <Search size={16} />
            <span className={styles["srOnly"]}>搜索商品</span>
            <input
              placeholder="搜索型号、品牌或商品标题"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>
          <select
            aria-label="筛选平台"
            value={filters.platform ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                platform: event.target.value || undefined,
              }))
            }
          >
            <option value="">全部平台</option>
            <option value="JD">京东</option>
            <option value="TAOBAO">淘宝</option>
            <option value="PDD">拼多多</option>
            <option value="TMALL">天猫</option>
          </select>
          <select
            aria-label="筛选状态"
            value={filters.status ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value || undefined,
              }))
            }
          >
            <option value="">全部状态</option>
            <option value="ACTIVE">已发布</option>
            <option value="DRAFT">草稿</option>
            <option value="DISABLED">已停用</option>
          </select>
          <button className={styles["secondaryButton"]} type="submit">
            应用筛选
          </button>
          <button
            aria-label="刷新数据"
            className={styles["iconButton"]}
            onClick={() => void load()}
            type="button"
          >
            <RefreshCw size={16} />
          </button>
        </form>

        {status === "error" ? (
          <div className={styles["errorState"]} role="alert">
            <TriangleAlert size={20} />
            <div>
              <strong>无法加载价格数据</strong>
              <span>{error}</span>
            </div>
            <button className={styles["secondaryButton"]} onClick={() => void load()} type="button">
              重新加载
            </button>
          </div>
        ) : (
          <section className={styles["catalogPanel"]} aria-busy={status === "loading"}>
            <div className={styles["tableHeader"]}>
              <span>标准商品</span>
              <span>匹配</span>
              <span>平台报价</span>
              <span>最低到手价</span>
              <span>状态</span>
            </div>
            <div className={styles["productList"]}>
              {status === "loading" && products.items.length === 0
                ? skeletonKeys.map((key) => <div className={styles["skeletonRow"]} key={key} />)
                : products.items.map((product) => {
                    const activeOffers = product.offers.filter((offer) => offer.enabled);
                    const lowest =
                      activeOffers.length > 0
                        ? Math.min(...activeOffers.map((offer) => offer.finalPrice))
                        : null;
                    const stale = activeOffers.some((offer) => offer.stale);
                    return (
                      <article
                        className={styles["productRow"]}
                        data-selected={product.id === selectedId}
                        key={product.id}
                      >
                        <button
                          className={styles["productIdentity"]}
                          onClick={() => {
                            setSelectedId(product.id);
                            setCreating(false);
                            setEditorOpen(true);
                          }}
                          type="button"
                        >
                          <span>{product.category}</span>
                          <strong>{product.title}</strong>
                          <small>
                            {product.brand} / {product.model}
                          </small>
                        </button>
                        <div className={styles["matchCell"]}>
                          <strong>{Math.round(product.matchConfidence * 100)}%</strong>
                          <span>{product.matchStatus}</span>
                        </div>
                        <div className={styles["offerCell"]}>
                          <strong>{activeOffers.length}</strong>
                          <span>
                            {[...new Set(activeOffers.map((offer) => offer.platform))].join(
                              " · ",
                            ) || "无报价"}
                          </span>
                        </div>
                        <div className={styles["priceCell"]}>
                          <strong>{lowest === null ? "未报价" : formatMoney(lowest)}</strong>
                          {stale ? <span data-warning>过期报价</span> : <span>已校验</span>}
                        </div>
                        <span className={styles["statusBadge"]} data-status={product.status}>
                          {product.status === "ACTIVE"
                            ? "已发布"
                            : product.status === "DRAFT"
                              ? "草稿"
                              : "已停用"}
                        </span>
                      </article>
                    );
                  })}
            </div>
            {status !== "loading" && products.items.length === 0 ? (
              <div className={styles["emptyState"]}>
                <PackageSearch size={28} strokeWidth={1.4} />
                <strong>没有匹配的商品</strong>
                <span>调整筛选条件，或创建第一条人工商品记录。</span>
              </div>
            ) : null}
            <footer className={styles["catalogFooter"]}>
              <span>
                显示 {products.items.length} / {products.total} 条商品
              </span>
              <span>报价必须经过人工审核后才会进入 Builder 推荐</span>
            </footer>
          </section>
        )}
      </section>

      {editorOpen ? (
        <aside className={styles["editorDrawer"]} aria-label="商品编辑器">
          <ProductEditor
            adminKey={adminKey}
            key={creating ? "new" : selectedProduct?.id}
            product={creating ? null : selectedProduct}
            onChanged={(nextSelectedId) => {
              setCreating(false);
              setSelectedId(nextSelectedId ?? null);
              void load(filters, nextSelectedId ?? null);
            }}
            onClose={() => setEditorOpen(false)}
          />
        </aside>
      ) : null}
    </main>
  );
}
