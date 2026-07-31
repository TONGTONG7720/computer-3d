import type { PriceHistory } from "../domain/price";
import styles from "./AdminPriceHistoryDialog.module.css";

type PriceChangeListProps = {
  readonly changes: PriceHistory["changes"];
};

const platformLabels: Readonly<Record<string, string>> = {
  JD: "京东",
  TAOBAO: "淘宝",
  PDD: "拼多多",
  TMALL: "天猫",
};

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);

const formatTime = (value: string): string =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export function PriceChangeList({ changes }: PriceChangeListProps) {
  return (
    <section className={styles["changeSection"]}>
      <header className={styles["changeHeading"]}>
        <div className={styles["changeHeadingCopy"]}>
          <small className={styles["changeEyebrow"]}>CHANGE LOG</small>
          <strong>变更明细</strong>
        </div>
        <span className={styles["changeCount"]}>最近 {Math.min(changes.length, 6)} 条</span>
      </header>
      <div className={styles["changeList"]}>
        {changes.slice(0, 6).map((change) => (
          <article
            className={styles["changeItem"]}
            key={`${change.offerId ?? "manual"}-${change.recordedAt}-${change.platform}-${change.finalPrice}`}
          >
            <div className={styles["changeMeta"]}>
              <strong>{platformLabels[change.platform] ?? change.platform}</strong>
              <small className={styles["changeDetail"]}>{formatTime(change.recordedAt)}</small>
            </div>
            <div className={styles["changePrice"]}>
              <strong>{formatMoney(change.finalPrice)}</strong>
              <small className={styles["changeDetail"]}>
                标价 {formatMoney(change.salePrice)} ·{" "}
                {change.stockStatus === "IN_STOCK" ? "有货" : "库存变更"}
              </small>
            </div>
          </article>
        ))}
        {changes.length === 0 ? (
          <p className={styles["changeEmpty"]}>当前周期内没有可展示的报价变更。</p>
        ) : null}
      </div>
    </section>
  );
}
