import { Fingerprint, LockKeyhole, Route } from "lucide-react";
import styles from "./AiAdminLogs.module.css";
import type { AiRequestLogPage } from "./domain/adminAi";

type LogWorkspaceProps = {
  readonly logs: AiRequestLogPage | null;
};

const formatTime = (value: string): string => value.replace("T", " ").slice(0, 19);

export function LogWorkspace({ logs }: LogWorkspaceProps) {
  return (
    <section className={styles["logWorkspace"]}>
      <header className={styles["logHeader"]}>
        <div>
          <Fingerprint size={17} />
          <span>
            <strong>Privacy-minimised traces</strong>
            <small>{logs?.total ?? 0} 条结构化记录</small>
          </span>
        </div>
        <div>
          <LockKeyhole size={13} />
          不存储原始对话
        </div>
      </header>
      <section aria-label="AI 请求日志" className={styles["logTable"]}>
        <div className={styles["logTableHeader"]}>
          <span>REQUEST / TIME</span>
          <span>ROUTE</span>
          <span>INTENT</span>
          <span>LATENCY</span>
          <span>TOKENS</span>
          <span>OUTCOME</span>
        </div>
        {logs?.items.map((log) => (
          <div className={styles["logRow"]} key={log.requestId}>
            <span data-label="REQUEST / TIME">
              <strong>{log.requestId.slice(0, 8).toUpperCase()}</strong>
              <small>{formatTime(log.createdAt)}</small>
            </span>
            <span className={styles["routeCell"]} data-label="ROUTE">
              <Route size={12} />
              {log.route}
            </span>
            <span data-label="INTENT">
              <strong>{log.purpose ?? "UNSPECIFIED"}</strong>
              <small>{log.budget ? `¥${log.budget.toLocaleString("zh-CN")}` : "NO BUDGET"}</small>
            </span>
            <span data-label="LATENCY">{log.latencyMillis}ms</span>
            <span data-label="TOKENS">{log.inputTokens + log.outputTokens}</span>
            <span data-label="OUTCOME">
              <em data-outcome={log.outcome}>{log.outcome}</em>
              {log.failureCode ? <small>{log.failureCode}</small> : null}
            </span>
          </div>
        ))}
        {logs?.items.length === 0 ? (
          <div className={styles["emptyWorkspace"]}>暂无 AI 请求记录。</div>
        ) : null}
      </section>
    </section>
  );
}
