"use client";

import {
  BadgeDollarSign,
  Box,
  Clock3,
  Database,
  MousePointerClick,
  Plus,
  TriangleAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import type { AdminDashboard } from "../domain/adminPrice";
import controls from "./AdminControls.module.css";
import overview from "./AdminOverview.module.css";
import styles from "./AdminShell.module.css";

type AdminWorkspaceOverviewProps = {
  readonly dashboard: AdminDashboard | null;
  readonly onCreate: () => void;
  readonly onLock: () => void;
};

const metrics = [
  { key: "activeProducts", label: "活跃商品", icon: Database, tone: "primary" },
  { key: "validOffers", label: "有效报价", icon: BadgeDollarSign, tone: "success" },
  { key: "staleOffers", label: "过期报价", icon: Clock3, tone: "warning" },
  { key: "missingCoverage", label: "缺少覆盖", icon: TriangleAlert, tone: "danger" },
  { key: "clicksLast24Hours", label: "24H 跳转", icon: MousePointerClick, tone: "neutral" },
] as const satisfies ReadonlyArray<{
  readonly key: keyof Pick<
    AdminDashboard,
    "activeProducts" | "validOffers" | "staleOffers" | "missingCoverage" | "clicksLast24Hours"
  >;
  readonly label: string;
  readonly icon: typeof Database;
  readonly tone: string;
}>;

const formatUpdatedAt = (value: string | undefined): string => {
  if (value === undefined) {
    return "正在连接价格服务";
  }
  return `服务已连接 · ${new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))} 更新`;
};

export function AdminWorkspaceOverview({
  dashboard,
  onCreate,
  onLock,
}: AdminWorkspaceOverviewProps) {
  return (
    <>
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
          <span className={styles["serviceState"]}>
            <i aria-hidden="true" />
            {formatUpdatedAt(dashboard?.generatedAt)}
          </span>
          <span className={styles["manualBadge"]}>人工数据</span>
          <button className={controls["sessionButton"]} onClick={onLock} type="button">
            <X size={14} />
            结束会话
          </button>
        </div>
      </header>

      <div className={overview["overviewBody"]} data-testid="admin-overview-safe-area">
        <div className={overview["pageIntro"]}>
          <div>
            <span className={controls["eyebrow"]}>MARKET OPERATIONS</span>
            <h1>价格情报控制台</h1>
            <p>
              人工审核商品、优惠与购买链接。V1 只使用
              <span className={controls["nowrap"]}>人工报价</span>，不调用平台 API 或爬虫。
            </p>
          </div>
          <button className={controls["primaryButton"]} onClick={onCreate} type="button">
            <Plus size={16} />
            新增商品
          </button>
        </div>

        <section aria-label="价格运营指标" className={overview["metricStrip"]}>
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article data-tone={metric.tone} key={metric.key}>
                <span>
                  <Icon size={16} strokeWidth={1.65} />
                </span>
                <div>
                  <small>{metric.label}</small>
                  <strong>{dashboard?.[metric.key] ?? 0}</strong>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </>
  );
}
