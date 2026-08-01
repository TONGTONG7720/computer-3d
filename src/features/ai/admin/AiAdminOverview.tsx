import { Activity, BookOpen, BrainCircuit, Clock3, Cpu, LogOut, Route } from "lucide-react";
import Link from "next/link";
import styles from "./AiAdminOverview.module.css";
import type { AiDashboard } from "./domain/adminAi";

export const aiAdminTabs = ["prompts", "knowledge", "rules", "logs"] as const;
export type AiAdminTab = (typeof aiAdminTabs)[number];

const tabLabels: Readonly<Record<AiAdminTab, string>> = {
  prompts: "Prompt Registry",
  knowledge: "Knowledge Base",
  rules: "Rule Matrix",
  logs: "Request Traces",
};

type AiAdminOverviewProps = {
  readonly activeTab: AiAdminTab;
  readonly dashboard: AiDashboard | null;
  readonly onLock: () => void;
  readonly onTabChange: (tab: AiAdminTab) => void;
};

export function AiAdminOverview({
  activeTab,
  dashboard,
  onLock,
  onTabChange,
}: AiAdminOverviewProps) {
  const metrics = [
    { label: "24H REQUESTS", value: dashboard?.requestsLast24Hours ?? "—", icon: Activity },
    {
      label: "ACTIVE KNOWLEDGE",
      value: dashboard?.activeKnowledgeDocuments ?? "—",
      icon: BookOpen,
    },
    { label: "ACTIVE RULES", value: dashboard?.activeRules ?? "—", icon: Cpu },
    {
      label: "SAFE FALLBACK",
      value: dashboard ? `${Math.round(dashboard.fallbackRate * 100)}%` : "—",
      icon: Route,
    },
    {
      label: "AVG LATENCY",
      value: dashboard ? `${dashboard.averageLatencyMillis}ms` : "—",
      icon: Clock3,
    },
    { label: "24H TOKENS", value: dashboard?.tokensLast24Hours ?? "—", icon: BrainCircuit },
  ] as const;

  return (
    <>
      <header className={styles["workspaceHeader"]}>
        <Link className={styles["brand"]} href="/">
          <span>
            <BrainCircuit size={18} />
          </span>
          <span>
            <strong>PC LAB</strong>
            <small>AI CONTROL PLANE</small>
          </span>
        </Link>
        <div className={styles["headerStatus"]}>
          <span>
            <i /> RULES-FIRST / ONLINE
          </span>
          <Link href="/admin/prices">价格控制台</Link>
          <button aria-label="锁定 AI 控制台" onClick={onLock} type="button">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <section className={styles["telemetry"]} aria-label="AI 运行遥测">
        {metrics.map(({ icon: Icon, label, value }) => (
          <div key={label}>
            <Icon size={14} />
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <nav aria-label="AI 管理工作区" className={styles["workspaceTabs"]}>
        {aiAdminTabs.map((tab) => (
          <button
            aria-current={activeTab === tab ? "page" : undefined}
            data-active={activeTab === tab}
            key={tab}
            onClick={() => onTabChange(tab)}
            type="button"
          >
            {tabLabels[tab]}
          </button>
        ))}
      </nav>
    </>
  );
}
