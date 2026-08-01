import type { PerformanceScores } from "@/features/builder/domain/PerformanceCalculator";
import styles from "./AnalysisCards.module.css";

type PerformanceCardProps = {
  readonly scores: PerformanceScores;
};

export function PerformanceCard({ scores }: PerformanceCardProps) {
  const rows = [
    { label: "游戏性能", value: scores.gaming },
    { label: "渲染性能", value: scores.production },
    { label: "AI 性能", value: scores.ai },
  ] as const;

  return (
    <section aria-labelledby="performance-title" className={styles["card"]}>
      <div className={styles["cardHeader"]}>
        <h3 id="performance-title">性能预测</h3>
        <span>0–100</span>
      </div>
      <div className={styles["scoreList"]}>
        {rows.map((row) => (
          <div className={styles["scoreRow"]} key={row.label}>
            <label htmlFor={`score-${row.label}`}>{row.label}</label>
            <meter id={`score-${row.label}`} max={100} min={0} value={row.value} />
            <output data-numeric="true">{row.value}</output>
          </div>
        ))}
      </div>
    </section>
  );
}
