const priceFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});

const timestampFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const formatPriceMoney = (value: number): string => priceFormatter.format(value);

export const formatPriceTimestamp = (value: string | null): string => {
  if (value === null) {
    return "更新时间待补充";
  }
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "更新时间待补充";
  }
  return `更新于 ${timestampFormatter.format(timestamp)}`;
};
