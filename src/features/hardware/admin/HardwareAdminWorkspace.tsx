"use client";

import {
  Box,
  Cpu,
  Database,
  LoaderCircle,
  LogOut,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AdminHardwareAccess } from "./AdminHardwareAccess";
import {
  fetchAdminHardware,
  fetchAdminHardwareDetail,
  fetchCompatibilityRules,
} from "./AdminHardwareApiClient";
import type { AdminHardwareDetail, AdminHardwareRecord, CompatibilityRule } from "./adminHardware";
import { CompatibilityRuleManager } from "./CompatibilityRuleManager";
import styles from "./HardwareAdmin.module.css";
import { HardwareEditor } from "./HardwareEditor";
import { HardwareModelManager } from "./HardwareModelManager";

const SESSION_KEY = "pc-lab-hardware-admin-key";
const tabs = ["catalogue", "models", "rules"] as const;
type AdminTab = (typeof tabs)[number];

const tabLabels: Readonly<Record<AdminTab, string>> = {
  catalogue: "硬件档案",
  models: "模型管理",
  rules: "兼容规则",
};

export function HardwareAdminWorkspace() {
  const [adminKey, setAdminKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("catalogue");
  const [records, setRecords] = useState<readonly AdminHardwareRecord[]>([]);
  const [rules, setRules] = useState<readonly CompatibilityRule[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminHardwareDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [detailStatus, setDetailStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const tabRefs = useRef<Record<AdminTab, HTMLButtonElement | null>>({
    catalogue: null,
    models: null,
    rules: null,
  });

  const loadOverview = useCallback(
    async (nextSelectedId?: number | null) => {
      if (!adminKey) return;
      setStatus("loading");
      setError("");
      try {
        const [nextRecords, nextRules] = await Promise.all([
          fetchAdminHardware(adminKey, {
            ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
            ...(category ? { category } : {}),
          }),
          fetchCompatibilityRules(adminKey),
        ]);
        setRecords(nextRecords);
        setRules(nextRules);
        const preferred = nextSelectedId ?? selectedId;
        const nextId =
          preferred !== null && nextRecords.some((item) => item.id === preferred)
            ? preferred
            : (nextRecords[0]?.id ?? null);
        setSelectedId(nextId);
        setStatus("ready");
      } catch (caught) {
        setStatus("error");
        setError(caught instanceof Error ? caught.message : "无法连接后台硬件服务");
      }
    },
    [adminKey, category, keyword, selectedId],
  );

  const loadDetail = useCallback(
    async (hardwareId: number): Promise<void> => {
      setDetailStatus("loading");
      try {
        setDetail(await fetchAdminHardwareDetail(adminKey, hardwareId));
        setDetailStatus("ready");
      } catch {
        setDetailStatus("error");
      }
    },
    [adminKey],
  );

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      setAdminKey(stored);
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (unlocked && adminKey) void loadOverview(null);
  }, [adminKey, loadOverview, unlocked]);

  useEffect(() => {
    if (unlocked && selectedId !== null && !creating) void loadDetail(selectedId);
  }, [creating, loadDetail, selectedId, unlocked]);

  const unlock = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const normalized = adminKey.trim();
    if (!normalized) return;
    window.sessionStorage.setItem(SESSION_KEY, normalized);
    setAdminKey(normalized);
    setUnlocked(true);
  };

  const lock = (): void => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
    setAdminKey("");
    setRecords([]);
    setRules([]);
    setDetail(null);
  };

  const reloadSelected = async (hardwareId = selectedId): Promise<void> => {
    setCreating(false);
    setSelectedId(hardwareId);
    await loadOverview(hardwareId);
    if (hardwareId !== null) await loadDetail(hardwareId);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const index = tabs.indexOf(activeTab);
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const nextTab = tabs[(index + offset + tabs.length) % tabs.length] ?? "catalogue";
    setActiveTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  if (!unlocked) {
    return (
      <AdminHardwareAccess adminKey={adminKey} onAdminKeyChange={setAdminKey} onUnlock={unlock} />
    );
  }

  return (
    <main className={styles["workspace"]} data-ui-version="v3">
      <header className={styles["adminHeader"]}>
        <Link href="/hardware">
          <span>
            <Database size={17} />
          </span>
          <strong>PC LAB</strong>
          <small>HARDWARE OPERATIONS</small>
        </Link>
        <div>
          <span>
            <ShieldCheck size={13} />
            ADMIN SESSION
          </span>
          <Link href="/builder">Builder</Link>
          <button onClick={lock} type="button">
            <LogOut size={14} />
            锁定
          </button>
        </div>
      </header>

      <div className={styles["adminShell"]}>
        <aside className={styles["adminRail"]}>
          <div
            aria-label="硬件后台工作区"
            className={styles["workspaceTabs"]}
            onKeyDown={handleTabKeyDown}
            role="tablist"
          >
            {tabs.map((tab) => (
              <button
                aria-selected={activeTab === tab}
                key={tab}
                onClick={() => setActiveTab(tab)}
                ref={(node) => {
                  tabRefs.current[tab] = node;
                }}
                role="tab"
                tabIndex={activeTab === tab ? 0 : -1}
                type="button"
              >
                {tab === "catalogue" ? (
                  <Cpu size={15} />
                ) : tab === "models" ? (
                  <Box size={15} />
                ) : (
                  <ShieldCheck size={15} />
                )}
                {tabLabels[tab]}
              </button>
            ))}
          </div>

          <form
            className={styles["adminFilters"]}
            onSubmit={(event) => {
              event.preventDefault();
              void loadOverview(null);
            }}
          >
            <label>
              <Search size={14} />
              <input
                aria-label="搜索后台硬件"
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="名称 / Hardware Key"
                value={keyword}
              />
            </label>
            <select
              aria-label="后台硬件分类"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="">全部分类</option>
              <option>CPU</option>
              <option>GPU</option>
              <option>MOTHERBOARD</option>
              <option>RAM</option>
              <option>SSD</option>
              <option>COOLING</option>
              <option>PSU</option>
              <option>CASE</option>
            </select>
            <button type="submit">筛选</button>
          </form>

          <div className={styles["recordList"]}>
            {status === "loading" ? (
              <p>
                <LoaderCircle className={styles["spin"]} size={14} />
                正在读取记录
              </p>
            ) : (
              records.map((record) => (
                <button
                  aria-pressed={!creating && selectedId === record.id}
                  key={record.id}
                  onClick={() => {
                    setCreating(false);
                    setSelectedId(record.id);
                  }}
                  type="button"
                >
                  <span className={styles["recordCopy"]}>
                    <strong>{record.name}</strong>
                    <small>
                      {record.brand} · {record.hardwareKey}
                    </small>
                  </span>
                  <b data-status={record.status}>{record.status}</b>
                </button>
              ))
            )}
          </div>
          <button
            className={styles["newRecordButton"]}
            onClick={() => {
              setCreating(true);
              setSelectedId(null);
              setDetail(null);
              setActiveTab("catalogue");
            }}
            type="button"
          >
            <Plus size={14} />
            新建硬件
          </button>
        </aside>

        <section className={styles["adminMain"]}>
          {status === "error" ? (
            <div className={styles["adminError"]} role="alert">
              <TriangleAlert size={20} />
              <span className={styles["adminErrorCopy"]}>
                <strong>无法加载硬件后台</strong>
                <small>{error}</small>
              </span>
              <button onClick={() => void loadOverview(null)} type="button">
                <RefreshCcw size={14} />
                重试
              </button>
            </div>
          ) : null}
          {status !== "error" && detailStatus === "loading" && !creating ? (
            <div className={styles["detailLoading"]}>
              <LoaderCircle className={styles["spin"]} size={18} />
              正在加载规格、性能与模型档案
            </div>
          ) : null}
          {status !== "error" && detailStatus === "error" && !creating ? (
            <div className={styles["adminError"]}>
              <TriangleAlert size={20} />
              <span className={styles["adminErrorCopy"]}>
                <strong>记录详情加载失败</strong>
                <small>列表仍可用；可重试当前记录。</small>
              </span>
              <button
                disabled={selectedId === null}
                onClick={() => (selectedId === null ? undefined : void loadDetail(selectedId))}
                type="button"
              >
                重试
              </button>
            </div>
          ) : null}
          {status !== "error" &&
          (creating || detailStatus === "ready") &&
          activeTab === "catalogue" ? (
            <HardwareEditor
              adminKey={adminKey}
              creating={creating}
              detail={detail}
              onSaved={reloadSelected}
            />
          ) : null}
          {status !== "error" && !creating && detailStatus === "ready" && activeTab === "models" ? (
            <HardwareModelManager
              adminKey={adminKey}
              detail={detail}
              onChanged={() => reloadSelected()}
            />
          ) : null}
          {status !== "error" && activeTab === "rules" ? (
            <CompatibilityRuleManager
              adminKey={adminKey}
              rules={rules}
              onChanged={() => loadOverview(selectedId)}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}
