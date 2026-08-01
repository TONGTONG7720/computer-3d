import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type {
  CompatibilityStatus,
  CompatibilitySummary,
} from "@/features/builder/domain/CompatibilityEngine";
import styles from "./AnalysisCards.module.css";

type CompatibilityCardProps = {
  readonly summary: CompatibilitySummary;
};

const statusLabels = {
  success: "兼容",
  warning: "需注意",
  error: "冲突",
} as const satisfies Readonly<Record<CompatibilityStatus, string>>;

const statusIcons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
} as const;

export function CompatibilityCard({ summary }: CompatibilityCardProps) {
  const issues = summary.results.filter((result) => result.status !== "success");
  const primaryMessage = issues[0]?.message ?? "所有插槽、电气和尺寸规则均通过";
  const StatusIcon = statusIcons[summary.status];

  return (
    <section aria-labelledby="compatibility-title" className={styles["card"]}>
      <div
        aria-label="兼容状态"
        className={styles["compatibilityStatus"]}
        data-status={summary.status}
        role="status"
      >
        <StatusIcon aria-hidden="true" size={17} strokeWidth={1.7} />
        <span>
          <strong id="compatibility-title">{statusLabels[summary.status]}</strong>
          <small>
            {summary.status === "success"
              ? `${summary.checkedRuleCount ?? summary.results.length} 条规则已检查`
              : `${issues.length} 项需要处理`}
          </small>
        </span>
      </div>
      <p>{primaryMessage}</p>
    </section>
  );
}
