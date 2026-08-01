import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { AnimatedNumber } from "@/features/builder/components/AnimatedNumber";
import { formatCurrency } from "@/features/hardware/hardwarePresentation";
import styles from "./AnalysisCards.module.css";

type PriceCardProps = {
  readonly powerUsage: number;
  readonly priceDelta: number;
  readonly totalPrice: number;
};

const formatPrice = (value: number): string => `¥${formatCurrency(value)}`;

export function PriceCard({ powerUsage, priceDelta, totalPrice }: PriceCardProps) {
  const DeltaIcon = priceDelta > 0 ? TrendingUp : TrendingDown;

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
      <div className={styles["priceMeta"]}>
        <span>本地硬件数据 · 含税估算</span>
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
