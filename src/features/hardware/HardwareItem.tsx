import { AlertTriangle, Check, LoaderCircle } from "lucide-react";
import type { CompatibilityResult } from "@/features/builder/domain/CompatibilityEngine";
import type { Hardware } from "@/features/builder/domain/hardware";
import styles from "./HardwareItem.module.css";
import {
  formatCurrency,
  formatHardwareSpec,
  getHardwareStateLabel,
  hardwareCategoryCodes,
} from "./hardwarePresentation";

type HardwareItemProps = {
  readonly compatibility: CompatibilityResult | null;
  readonly disabledReason?: string | undefined;
  readonly hardware: Hardware;
  readonly installed: boolean;
  readonly loading?: boolean;
  readonly onSelect: (hardware: Hardware) => void;
};

export function HardwareItem({
  compatibility,
  disabledReason,
  hardware,
  installed,
  loading = false,
  onSelect,
}: HardwareItemProps) {
  const disabled = disabledReason !== undefined || loading;
  const stateLabel = getHardwareStateLabel(installed, compatibility);
  const status = compatibility?.status ?? (installed ? "installed" : "default");
  const detail = compatibility === null ? formatHardwareSpec(hardware) : compatibility.message;

  return (
    <button
      aria-label={`${hardware.name}，${stateLabel}，¥${formatCurrency(hardware.price)}`}
      aria-pressed={installed}
      className={styles["item"]}
      data-state={status}
      disabled={disabled}
      onClick={() => onSelect(hardware)}
      title={disabledReason ?? compatibility?.message}
      type="button"
    >
      <span aria-hidden="true" className={styles["silhouette"]}>
        <span>{hardwareCategoryCodes[hardware.category]}</span>
      </span>
      <span className={styles["content"]}>
        <small>{hardware.brand}</small>
        <strong>{hardware.name}</strong>
        <span title={detail}>
          性能 {hardware.performance} · {detail}
        </span>
      </span>
      <span className={styles["value"]}>
        <strong data-numeric="true">¥{formatCurrency(hardware.price)}</strong>
        <span data-state={status}>
          {loading ? (
            <LoaderCircle aria-hidden="true" size={12} />
          ) : compatibility?.status === "error" || compatibility?.status === "warning" ? (
            <AlertTriangle aria-hidden="true" size={12} />
          ) : installed ? (
            <Check aria-hidden="true" size={12} />
          ) : null}
          {stateLabel}
        </span>
      </span>
      {loading ? <span aria-hidden="true" className={styles["progress"]} /> : null}
    </button>
  );
}
