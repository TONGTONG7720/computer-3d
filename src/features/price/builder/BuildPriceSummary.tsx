import { ArrowUpRight, RefreshCw } from "lucide-react";
import styles from "./BuildPriceSummary.module.css";
import { formatPriceMoney } from "./priceFormat";
import type { BuildQuoteState } from "./useBuildQuote";

type BuildPriceSummaryProps = {
  readonly internalTotal: number;
  readonly onOpenPrices: () => void;
  readonly quoteState: BuildQuoteState;
};

const quoteStatusMessage = ({ quote, status }: BuildQuoteState): string => {
  if (status === "loading") {
    return "正在同步平台报价";
  }
  if (status === "error") {
    return "平台报价暂不可用";
  }
  if (status === "success" && quote !== null) {
    return quote.complete
      ? `${quote.pricedComponentCount} / ${quote.componentCount} 组件已有平台报价`
      : `部分覆盖 · ${quote.pricedComponentCount} / ${quote.componentCount} 组件已有平台报价`;
  }
  return "选择硬件后获取平台报价";
};

export function BuildPriceSummary({
  internalTotal,
  onOpenPrices,
  quoteState,
}: BuildPriceSummaryProps) {
  const { quote, retry, status } = quoteState;
  const quoteReady = status === "success" && quote !== null;
  const lowestTotal = quoteReady ? formatPriceMoney(quote.lowestTotal) : "—";
  const saving = quoteReady ? `可节省 ${formatPriceMoney(quote.savings)}` : null;
  const retrying = status === "error";

  return (
    <section aria-label="整机价格情报" className={styles["summary"]} data-status={status}>
      <dl className={styles["values"]}>
        <div>
          <dt>内部参考</dt>
          <dd>{formatPriceMoney(internalTotal)}</dd>
        </div>
        <div>
          <dt>最低购买</dt>
          <dd>{lowestTotal}</dd>
        </div>
      </dl>
      <p className={styles["status"]} role={status === "error" ? "alert" : "status"}>
        <span>{quoteStatusMessage(quoteState)}</span>
        {saving === null ? null : <strong>{saving}</strong>}
      </p>
      <button
        disabled={status === "idle" || status === "loading"}
        onClick={retrying ? retry : onOpenPrices}
        type="button"
      >
        {retrying ? (
          <RefreshCw aria-hidden="true" size={15} strokeWidth={1.7} />
        ) : (
          <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.7} />
        )}
        {retrying ? "重新获取平台报价" : "查看购买方案"}
      </button>
    </section>
  );
}
