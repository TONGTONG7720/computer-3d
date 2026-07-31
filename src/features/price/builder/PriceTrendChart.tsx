"use client";

import { useId } from "react";
import type { PriceHistory } from "../domain/price";
import styles from "./PriceComparisonDialog.module.css";

type PriceTrendChartProps = {
  readonly ariaLabel: string;
  readonly history: PriceHistory;
};

type ChartPoint = {
  readonly x: number;
  readonly y: number;
  readonly value: number;
  readonly date: string;
};

const width = 640;
const height = 220;
const insetX = 20;
const insetY = 24;

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);

const toChartPoints = (history: PriceHistory): readonly ChartPoint[] => {
  const prices = history.points.map((point) => point.minimumPrice);
  if (prices.length === 0) {
    return [];
  }
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  const spread = Math.max(maximum - minimum, 1);
  const usableWidth = width - insetX * 2;
  const usableHeight = height - insetY * 2;

  return history.points.map((point, index) => ({
    x:
      history.points.length === 1
        ? width / 2
        : insetX + (index / (history.points.length - 1)) * usableWidth,
    y: insetY + ((maximum - point.minimumPrice) / spread) * usableHeight,
    value: point.minimumPrice,
    date: point.date,
  }));
};

export function PriceTrendChart({ ariaLabel, history }: PriceTrendChartProps) {
  const gradientId = useId();
  const points = toChartPoints(history);
  const firstPoint = points.at(0);
  const lastPoint = points.at(-1);

  if (!firstPoint || !lastPoint) {
    return (
      <div className={styles["chartEmpty"]}>
        <strong>暂无趋势数据</strong>
        <span>保存至少两次报价后，将在这里形成价格曲线。</span>
      </div>
    );
  }

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${lastPoint.x} ${height - insetY} L ${firstPoint.x} ${
    height - insetY
  } Z`;

  return (
    <div className={styles["chartRoot"]}>
      <svg
        aria-label={ariaLabel}
        className={styles["chart"]}
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <title>{ariaLabel}</title>
        <desc>
          {history.range} 最低价 {formatMoney(history.lowestPrice ?? firstPoint.value)}，最高价{" "}
          {formatMoney(history.highestPrice ?? firstPoint.value)}。
        </desc>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className={styles["chartArea"]} d={areaPath} fill={`url(#${gradientId})`} />
        <path className={styles["chartLine"]} d={linePath} />
        {points.map((point) => (
          <circle
            className={styles["chartPoint"]}
            cx={point.x}
            cy={point.y}
            key={point.date}
            r="4"
          />
        ))}
      </svg>
      <div className={styles["chartAxis"]}>
        <span>{firstPoint.date.slice(5)}</span>
        <span>{lastPoint.date.slice(5)}</span>
      </div>
      <div className={styles["chartSummary"]}>
        <span>
          区间最低
          <strong>{formatMoney(history.lowestPrice ?? firstPoint.value)}</strong>
        </span>
        <span>
          区间最高
          <strong>{formatMoney(history.highestPrice ?? firstPoint.value)}</strong>
        </span>
        <span data-positive={history.changePercent <= 0}>
          区间变化
          <strong>
            {history.changePercent > 0 ? "+" : ""}
            {history.changePercent.toFixed(2)}%
          </strong>
        </span>
      </div>
    </div>
  );
}
