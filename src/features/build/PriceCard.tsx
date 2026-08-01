import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { AnimatedNumber } from "@/features/builder/components/AnimatedNumber";
import type { BudgetReport, BuildAnalysis } from "@/features/builder/domain/intelligence";
import { formatCurrency } from "@/features/hardware/hardwarePresentation";
import type { AnalysisStatus } from "@/store/builderStore";
import styles from "./AnalysisCards.module.css";

type PriceCardProps = {
  readonly analysisStatus: AnalysisStatus;
  readonly budgetReport: BudgetReport | null;
  readonly powerUsage: number;
  readonly priceDelta: number;
  readonly priceSource: BuildAnalysis["priceSource"] | null;
  readonly totalPrice: number;
};

const formatPrice = (value: number): string => `¥${formatCurrency(value)}`;

const budgetMessage = (report: BudgetReport | null, status: AnalysisStatus): string => {
  if (status === "loading") {
    return "正在校准预算";
  }
  if (status === "error") {
    return "预算分析暂不可用";
  }
  if (report === null) {
    return "等待硬件数据中心校准";
  }
  if (report.status === "OVER") {
    return `超出预算 ¥${formatCurrency(report.overage)}`;
  }
  if (report.status === "NEAR_LIMIT") {
    return `接近预算 · 剩余 ¥${formatCurrency(report.remaining)}`;
  }
  return `剩余预算 ¥${formatCurrency(report.remaining)}`;
};

export function PriceCard({
  analysisStatus,
  budgetReport,
  powerUsage,
  priceDelta,
  priceSource,
  totalPrice,
}: PriceCardProps) {
  const DeltaIcon = priceDelta > 0 ? TrendingUp : TrendingDown;
  const budgetStatus = budgetReport?.status.toLowerCase() ?? analysisStatus;

  return (
    <section aria-labelledby="total-price-title" className={styles["priceCard"]}>
      <div className={styles["priceLabel"]}>
        <span>
          <small>内部估价</small>
          <strong id="total-price-title">TOTAL</strong>
        </span>
        <span>
          <Activity aria-hidden="true" size={14} strokeWidth={1.6} />
          <strong data-numeric="true">{powerUsage}W</strong>
        </span>
      </div>
      <AnimatedNumber className={styles["price"] ?? ""} format={formatPrice} value={totalPrice} />
      <p className={styles["budgetStatus"]} data-status={budgetStatus}>
        {budgetMessage(budgetReport, analysisStatus)}
      </p>
      <div className={styles["priceMeta"]}>
        <span>
          {priceSource === "PC_LAB_INTERNAL_REFERENCE"
            ? "PC LAB 内部参考价 · 非实时商城报价"
            : "本地计算预览 · 待硬件数据中心校准"}
        </span>
        {priceDelta !== 0 ? (
          <span data-direction={priceDelta > 0 ? "up" : "down"}>
            <DeltaIcon aria-hidden="true" size={12} strokeWidth={1.6} />
            {priceDelta > 0 ? "+" : "-"}¥{formatCurrency(Math.abs(priceDelta))}
          </span>
        ) : null}
      </div>
    </section>
  );
}
