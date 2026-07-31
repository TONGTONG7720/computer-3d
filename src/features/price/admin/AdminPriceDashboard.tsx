"use client";

import { TriangleAlert } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  type AdminProductFilters,
  fetchAdminDashboard,
  fetchAdminProducts,
} from "../api/AdminPriceApiClient";
import type { AdminDashboard, AdminProductPage } from "../domain/adminPrice";
import { AdminAccessGate } from "./AdminAccessGate";
import controls from "./AdminControls.module.css";
import drawerStyles from "./AdminDrawer.module.css";
import { AdminProductCatalog } from "./AdminProductCatalog";
import { AdminProductFilters as ProductFilters } from "./AdminProductFilters";
import styles from "./AdminShell.module.css";
import { AdminWorkspaceOverview } from "./AdminWorkspaceOverview";
import { ProductEditor } from "./ProductEditor";

const SESSION_KEY = "pc-lab-price-admin-key";

const emptyPage: AdminProductPage = {
  page: 1,
  size: 20,
  total: 0,
  totalPages: 0,
  items: [],
};

type LoadRequest = {
  readonly filters: AdminProductFilters;
  readonly selectedId: number | null;
};

const toMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "无法加载价格数据，请检查服务状态。";

export function AdminPriceDashboard() {
  const [adminKey, setAdminKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [products, setProducts] = useState<AdminProductPage>(emptyPage);
  const [filters, setFilters] = useState<AdminProductFilters>({ page: 1, size: 20 });
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");

  const load = useCallback(
    async ({ filters: nextFilters, selectedId: nextSelectedId }: LoadRequest) => {
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
    [adminKey],
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
      void load({ filters: { page: 1, size: 20 }, selectedId: null });
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
    setSelectedId(null);
    setEditorOpen(false);
  };

  const appliedFilters = (page = 1): AdminProductFilters => ({
    ...filters,
    keyword: keyword.trim() || undefined,
    page,
    size: 20,
  });

  const selectedProduct = products.items.find((product) => product.id === selectedId) ?? null;

  if (!unlocked) {
    return <AdminAccessGate adminKey={adminKey} onAdminKeyChange={setAdminKey} onUnlock={unlock} />;
  }

  return (
    <main className={styles["workspace"]}>
      <AdminWorkspaceOverview
        dashboard={dashboard}
        onCreate={() => {
          setCreating(true);
          setSelectedId(null);
          setEditorOpen(true);
        }}
        onLock={lock}
      />

      <section className={styles["workspaceBody"]}>
        <ProductFilters
          filters={filters}
          keyword={keyword}
          loading={status === "loading"}
          onApply={() => {
            const nextFilters = appliedFilters();
            void load({ filters: nextFilters, selectedId: null });
          }}
          onFiltersChange={setFilters}
          onKeywordChange={setKeyword}
          onRefresh={() => void load({ filters: appliedFilters(products.page), selectedId })}
        />

        {status === "error" ? (
          <div className={styles["errorState"]} role="alert">
            <TriangleAlert size={20} />
            <div className={styles["errorCopy"]}>
              <strong className={styles["errorTitle"]}>无法加载价格数据</strong>
              <span className={styles["errorDetail"]}>{error}</span>
            </div>
            <button
              className={controls["secondaryButton"]}
              onClick={() => void load({ filters: appliedFilters(products.page), selectedId })}
              type="button"
            >
              重新加载
            </button>
          </div>
        ) : (
          <AdminProductCatalog
            loading={status === "loading"}
            onPageChange={(page) => {
              const nextFilters = appliedFilters(page);
              void load({ filters: nextFilters, selectedId: null });
            }}
            onSelect={(productId) => {
              setSelectedId(productId);
              setCreating(false);
              setEditorOpen(true);
            }}
            products={products}
            selectedId={selectedId}
          />
        )}
      </section>

      {editorOpen ? (
        <aside className={drawerStyles["editorDrawer"]} aria-label="商品编辑器">
          <ProductEditor
            adminKey={adminKey}
            key={creating ? "new" : selectedProduct?.id}
            product={creating ? null : selectedProduct}
            onChanged={(nextSelectedId) => {
              const nextFilters = creating ? appliedFilters(1) : appliedFilters(products.page);
              setCreating(false);
              setSelectedId(nextSelectedId ?? null);
              void load({ filters: nextFilters, selectedId: nextSelectedId ?? null });
            }}
            onClose={() => setEditorOpen(false)}
          />
        </aside>
      ) : null}
    </main>
  );
}
