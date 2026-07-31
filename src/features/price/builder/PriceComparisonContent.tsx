import { PackageSearch, ShieldCheck } from "lucide-react";
import type { PriceComparison, PriceHistory, PriceRange } from "../domain/price";
import contentStyles from "./PriceComparisonContent.module.css";
import historyStyles from "./PriceHistoryPanel.module.css";
import { PriceOfferCard } from "./PriceOfferCard";
import { PriceTrendChart } from "./PriceTrendChart";
import { formatPriceMoney } from "./priceFormat";
import type { PriceLoadStatus } from "./usePriceComparison";

type PriceComparisonContentProps = {
  readonly comparison: PriceComparison;
  readonly history: PriceHistory | null;
  readonly historyStatus: PriceLoadStatus;
  readonly onRangeChange: (range: PriceRange) => void;
  readonly range: PriceRange;
};

const chartLabel = (hardwareName: string): string =>
  `${hardwareName.replace("NVIDIA GeForce ", "").replace("AMD Radeon ", "")} 价格趋势`;

export function PriceComparisonContent({
  comparison,
  history,
  historyStatus,
  onRangeChange,
  range,
}: PriceComparisonContentProps) {
  const recommendedOffer =
    comparison.offers.find((offer) => offer.id === comparison.recommendedOfferId) ?? null;
  const lowestPrice =
    comparison.lowestPrice === null ? "暂无报价" : formatPriceMoney(comparison.lowestPrice);

  return (
    <div className={contentStyles["dialogBody"]}>
      <section className={contentStyles["marketColumn"]}>
        <div className={contentStyles["mobilePriceSummary"]}>
          <span>当前最低</span>
          <strong>{lowestPrice}</strong>
          <small>{recommendedOffer?.seller ?? "可靠商家待补充"}</small>
        </div>
        <div className={contentStyles["priceSummary"]}>
          <div>
            <span>当前最低价</span>
            <strong>{lowestPrice}</strong>
          </div>
          <div>
            <span>内部参考价</span>
            <strong>{formatPriceMoney(comparison.internalReferencePrice)}</strong>
          </div>
          <div>
            <span>可靠商家</span>
            <strong>{recommendedOffer?.seller ?? "待补充"}</strong>
          </div>
        </div>

        {comparison.offers.length > 0 ? (
          <div className={contentStyles["offerList"]}>
            {comparison.offers.map((offer) => (
              <PriceOfferCard
                key={offer.id}
                lowestOfferId={comparison.lowestOfferId}
                offer={offer}
                recommendedOfferId={comparison.recommendedOfferId}
              />
            ))}
          </div>
        ) : (
          <div className={contentStyles["noOffers"]}>
            <PackageSearch size={24} />
            <strong>暂无可购买报价</strong>
            <span>仍可使用内部参考价完成配置。</span>
          </div>
        )}
      </section>

      <section className={contentStyles["historyColumn"]}>
        <div className={historyStyles["historyHeader"]}>
          <div>
            <span>价格趋势</span>
            <strong>{comparison.recommendedReason}</strong>
          </div>
          <div className={historyStyles["rangeSwitch"]}>
            <button aria-pressed={range === "7D"} onClick={() => onRangeChange("7D")} type="button">
              7 天
            </button>
            <button
              aria-pressed={range === "30D"}
              onClick={() => onRangeChange("30D")}
              type="button"
            >
              30 天
            </button>
          </div>
        </div>
        {historyStatus === "loading" && history === null ? (
          <div className={historyStyles["chartLoading"]}>正在读取价格历史</div>
        ) : history ? (
          <PriceTrendChart ariaLabel={chartLabel(comparison.hardwareName)} history={history} />
        ) : (
          <div className={historyStyles["chartLoading"]}>暂无可用趋势数据</div>
        )}
        <div className={historyStyles["trustNote"]}>
          <ShieldCheck size={16} />
          <p>
            <strong className={historyStyles["trustTitle"]}>推荐逻辑透明</strong>
            <span className={historyStyles["trustBody"]}>
              综合价格、销量、评价与店铺信誉，不保证最低价就是最佳选择。
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}
