"use client";

import { Bell, BellRing, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { deletePriceAlert, getPriceAlerts, upsertPriceAlert } from "../api/PriceApiClient";
import type { PriceAlert, PriceAlertOwner } from "../domain/price";
import styles from "./PriceAlertControl.module.css";
import { getOrCreatePriceAlertOwner } from "./priceAlertOwner";
import { formatPriceMoney } from "./priceFormat";

type PriceAlertControlProps = Readonly<{ hardwareKey: string; hardwareName: string }>;

type AlertControlStatus = "loading" | "ready" | "saving" | "deleting" | "error";

type AlertContext = {
  readonly hardwareKey: string;
  readonly alert: PriceAlert | null;
  readonly targetValue: string;
  readonly status: AlertControlStatus;
};

const isValidTarget = (value: string): boolean =>
  Number(value) >= 0.01 && Number(value) <= 9_999_999.99;

export function PriceAlertControl({ hardwareKey, hardwareName }: PriceAlertControlProps) {
  const [owner, setOwner] = useState<PriceAlertOwner | null>(null);
  const [ownerResolved, setOwnerResolved] = useState(false);
  const [alertContext, setAlertContext] = useState<AlertContext>({
    hardwareKey: "",
    alert: null,
    targetValue: "",
    status: "loading",
  });
  const requestRevision = useRef(0);
  useEffect(() => {
    setOwner(getOrCreatePriceAlertOwner());
    setOwnerResolved(true);
  }, []);

  const loadAlert = useCallback(async () => {
    if (!ownerResolved) {
      return;
    }
    const revision = ++requestRevision.current;
    setAlertContext({
      hardwareKey,
      alert: null,
      targetValue: "",
      status: owner === null ? "error" : "loading",
    });
    if (owner === null) {
      return;
    }

    try {
      const alerts = await getPriceAlerts(owner);
      if (revision !== requestRevision.current) {
        return;
      }
      const currentAlert =
        alerts.find((candidate) => candidate.hardwareKey === hardwareKey) ?? null;
      setAlertContext({
        hardwareKey,
        alert: currentAlert,
        targetValue: currentAlert === null ? "" : String(currentAlert.targetPrice),
        status: "ready",
      });
    } catch {
      if (revision === requestRevision.current) {
        setAlertContext((current) => ({ ...current, hardwareKey, status: "error" }));
      }
    }
  }, [hardwareKey, owner, ownerResolved]);

  useEffect(() => {
    void loadAlert();
    return () => {
      requestRevision.current += 1;
    };
  }, [loadAlert]);

  const retry = () => {
    if (owner !== null) {
      void loadAlert();
      return;
    }
    setOwner(getOrCreatePriceAlertOwner());
  };

  const saveAlert = async () => {
    const targetValue = alertContext.hardwareKey === hardwareKey ? alertContext.targetValue : "";
    if (owner === null || !isValidTarget(targetValue)) {
      return;
    }
    const revision = ++requestRevision.current;
    setAlertContext((current) => ({ ...current, hardwareKey, status: "saving" }));
    try {
      const savedAlert = await upsertPriceAlert(hardwareKey, Number(targetValue), owner);
      if (revision !== requestRevision.current) {
        return;
      }
      setAlertContext({
        hardwareKey,
        alert: savedAlert,
        targetValue: String(savedAlert.targetPrice),
        status: "ready",
      });
    } catch {
      if (revision === requestRevision.current) {
        setAlertContext((current) => ({ ...current, hardwareKey, status: "error" }));
      }
    }
  };

  const removeAlert = async () => {
    const alert = alertContext.hardwareKey === hardwareKey ? alertContext.alert : null;
    if (owner === null || alert === null) {
      return;
    }
    const revision = ++requestRevision.current;
    setAlertContext((current) => ({ ...current, hardwareKey, status: "deleting" }));
    try {
      await deletePriceAlert(alert.publicId, owner);
      if (revision !== requestRevision.current) {
        return;
      }
      setAlertContext({ hardwareKey, alert: null, targetValue: "", status: "ready" });
    } catch {
      if (revision === requestRevision.current) {
        setAlertContext((current) => ({ ...current, hardwareKey, status: "error" }));
      }
    }
  };

  const status = alertContext.hardwareKey === hardwareKey ? alertContext.status : "loading";

  if (!ownerResolved || status === "loading") {
    return (
      <section className={styles["alertControl"]}>
        <div aria-live="polite" className={styles["alertState"]} role="status">
          <LoaderCircle aria-hidden="true" className={styles["spinner"]} size={18} />
          <span>正在读取价格提醒</span>
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className={styles["alertControl"]}>
        <div className={styles["alertError"]} role="alert">
          <strong>价格提醒暂不可用</strong>
          <span>浏览器存储或价格服务暂时不可访问。</span>
          <button onClick={retry} type="button">
            <RefreshCw aria-hidden="true" size={15} />
            重试价格提醒
          </button>
        </div>
      </section>
    );
  }

  const pending = status === "saving" || status === "deleting";
  const currentContext = alertContext.hardwareKey === hardwareKey ? alertContext : null;
  const alert = currentContext?.alert ?? null;
  const targetValue = currentContext?.targetValue ?? "";
  const triggered = alert?.status === "TRIGGERED";
  const AlertIcon = triggered ? BellRing : Bell;

  return (
    <section className={styles["alertControl"]} aria-labelledby="price-alert-heading">
      <header className={styles["alertHeader"]}>
        <div>
          <AlertIcon aria-hidden="true" size={18} />
          <div>
            <strong id="price-alert-heading">目标价提醒</strong>
            <span>{hardwareName}</span>
          </div>
        </div>
        {alert ? <small data-triggered={triggered}>{triggered ? "已达标" : "监测中"}</small> : null}
      </header>

      {alert ? (
        <div aria-live="polite" className={styles["alertSummary"]} role="status">
          <strong>{triggered ? "已达目标价" : "目标价监测中"}</strong>
          <span>
            {alert.currentBestPrice === null
              ? "当前最低价待补充"
              : `当前最低 ${formatPriceMoney(alert.currentBestPrice)}`}{" "}
            · 目标 {formatPriceMoney(alert.targetPrice)}
          </span>
        </div>
      ) : (
        <p className={styles["alertIntro"]}>
          价格达到目标后，将在本浏览器的装机面板内显示达标状态。
        </p>
      )}

      <form
        className={styles["alertForm"]}
        onSubmit={(event) => {
          event.preventDefault();
          void saveAlert();
        }}
      >
        <label htmlFor={`price-alert-target-${hardwareKey}`}>
          目标到手价
          <span aria-hidden="true">人民币</span>
        </label>
        <div className={styles["alertActions"]}>
          <input
            disabled={pending}
            id={`price-alert-target-${hardwareKey}`}
            inputMode="decimal"
            max="9999999.99"
            min="0.01"
            onChange={(event) =>
              setAlertContext({
                hardwareKey,
                alert,
                targetValue: event.target.value,
                status,
              })
            }
            placeholder="例如 19999"
            step="0.01"
            type="number"
            value={targetValue}
          />
          <button disabled={pending || !isValidTarget(targetValue)} type="submit">
            {status === "saving" ? "保存中" : alert ? "更新提醒" : "设置提醒"}
          </button>
          {alert ? (
            <button
              aria-label="取消提醒"
              className={styles["deleteButton"]}
              disabled={pending}
              onClick={() => void removeAlert()}
              type="button"
            >
              <Trash2 aria-hidden="true" size={15} />
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
