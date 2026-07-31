"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeDollarSign,
  LoaderCircle,
  PackageSearch,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSelectedHardware } from "@/features/builder/domain/hardware";
import { useBuilderStore } from "@/store/builderStore";
import type { PriceRange } from "../domain/price";
import styles from "./PriceComparisonDialog.module.css";
import { PriceOfferCard } from "./PriceOfferCard";
import { PriceTrendChart } from "./PriceTrendChart";
import { usePriceComparisonData } from "./usePriceComparison";

type PriceComparisonDialogProps = {
  readonly onClose: () => void;
  readonly open: boolean;
};

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);

const chartLabel = (hardwareName: string): string =>
  `${hardwareName.replace("NVIDIA GeForce ", "").replace("AMD Radeon ", "")} 价格趋势`;

export function PriceComparisonDialog({ onClose, open }: PriceComparisonDialogProps) {
  const selectedComponents = useBuilderStore((state) => state.selectedComponents);
  const activeCategory = useBuilderStore((state) => state.activeCategory);
  const hardware = getSelectedHardware(selectedComponents, activeCategory);
  const [range, setRange] = useState<PriceRange>("30D");
  const { comparison, comparisonStatus, error, history, historyStatus, retry } =
    usePriceComparisonData(hardware?.id ?? null, open, range);

  useEffect(() => {
    if (!open) {
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  const recommendedOffer = useMemo(
    () => comparison?.offers.find((offer) => offer.id === comparison.recommendedOfferId) ?? null,
    [comparison],
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className={styles["backdrop"]}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.section
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-labelledby="price-dialog-title"
            aria-modal="true"
            className={styles["dialog"]}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            initial={{ opacity: 0, scale: 0.98, y: 16 }}
            role="dialog"
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <header className={styles["dialogHeader"]}>
              <div className={styles["dialogIdentity"]}>
                <span>
                  <BadgeDollarSign size={20} strokeWidth={1.5} />
                </span>
                <div>
                  <small>PRICE INTELLIGENCE</small>
                  <h2 id="price-dialog-title">{hardware?.name ?? "当前硬件"}</h2>
                </div>
              </div>
              <button
                aria-label="关闭比价"
                className={styles["closeButton"]}
                onClick={onClose}
                type="button"
              >
                <X size={18} />
              </button>
            </header>

            {!hardware ? (
              <div className={styles["emptyState"]}>
                <PackageSearch size={28} />
                <strong>请先选择硬件</strong>
                <span>选择一个组件后即可查看平台报价。</span>
              </div>
            ) : comparisonStatus === "loading" && !comparison ? (
              <div className={styles["loadingState"]} role="status">
                <LoaderCircle size={28} />
                <strong>正在校验人工报价</strong>
                <span>同步优惠、可信分与历史价格。</span>
              </div>
            ) : comparisonStatus === "error" ? (
              <div className={styles["errorState"]} role="alert">
                <strong>价格服务连接失败</strong>
                <span>{error}</span>
                <button onClick={retry} type="button">
                  <RefreshCw size={15} />
                  重新加载
                </button>
              </div>
            ) : comparison ? (
              <div className={styles["dialogBody"]}>
                <section className={styles["marketColumn"]}>
                  <div className={styles["priceSummary"]}>
                    <div>
                      <span>当前最低价</span>
                      <strong>
                        {comparison.lowestPrice === null
                          ? "暂无报价"
                          : formatMoney(comparison.lowestPrice)}
                      </strong>
                    </div>
                    <div>
                      <span>内部参考价</span>
                      <strong>{formatMoney(comparison.internalReferencePrice)}</strong>
                    </div>
                    <div>
                      <span>可靠商家</span>
                      <strong>{recommendedOffer?.seller ?? "待补充"}</strong>
                    </div>
                  </div>

                  {comparison.offers.length > 0 ? (
                    <div className={styles["offerList"]}>
                      {comparison.offers.map((offer) => (
                        <PriceOfferCard
                          lowestOfferId={comparison.lowestOfferId}
                          offer={offer}
                          recommendedOfferId={comparison.recommendedOfferId}
                          key={offer.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className={styles["noOffers"]}>
                      <PackageSearch size={24} />
                      <strong>暂无可购买报价</strong>
                      <span>仍可使用内部参考价完成配置。</span>
                    </div>
                  )}
                </section>

                <section className={styles["historyColumn"]}>
                  <div className={styles["historyHeader"]}>
                    <div>
                      <span>价格趋势</span>
                      <strong>{comparison.recommendedReason}</strong>
                    </div>
                    <div className={styles["rangeSwitch"]}>
                      <button
                        aria-pressed={range === "7D"}
                        onClick={() => setRange("7D")}
                        type="button"
                      >
                        7 天
                      </button>
                      <button
                        aria-pressed={range === "30D"}
                        onClick={() => setRange("30D")}
                        type="button"
                      >
                        30 天
                      </button>
                    </div>
                  </div>
                  {historyStatus === "loading" && !history ? (
                    <div className={styles["chartLoading"]}>正在读取价格历史</div>
                  ) : history ? (
                    <PriceTrendChart
                      ariaLabel={chartLabel(comparison.hardwareName)}
                      history={history}
                    />
                  ) : (
                    <div className={styles["chartLoading"]}>暂无可用趋势数据</div>
                  )}
                  <div className={styles["trustNote"]}>
                    <ShieldCheck size={16} />
                    <p>
                      <strong>推荐逻辑透明</strong>
                      <span>综合价格、销量、评价与店铺信誉，不保证最低价即最佳选择。</span>
                    </p>
                  </div>
                </section>
              </div>
            ) : null}

            {comparison ? (
              <footer className={styles["disclosure"]}>
                <span>{comparison.disclosure}</span>
                <strong>{comparison.dataMode === "MANUAL" ? "人工维护" : "平台同步"}</strong>
              </footer>
            ) : null}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
