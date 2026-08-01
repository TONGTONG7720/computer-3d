"use client";

import { Box, CheckCircle2, ChevronRight, Cuboid, Gauge, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Hardware } from "@/features/builder/domain/hardware";
import { formatHardwareSpec } from "@/features/builder/domain/hardware";
import { HardwareCategoryIcon } from "@/features/hardware/HardwareCategoryIcon";
import { formatCurrency, hardwareCategoryLabels } from "@/features/hardware/hardwarePresentation";
import { queueBuilderHardware } from "./builderHandoff";
import styles from "./HardwareExplorer.module.css";

type HardwareResultRowProps = {
  readonly hardware: Hardware;
};

const profileLabels = [
  ["gaming", "GAME"],
  ["creator", "CREATE"],
  ["ai", "AI"],
] as const;

export function HardwareResultRow({ hardware }: HardwareResultRowProps) {
  const router = useRouter();
  const profile = hardware.performanceProfile ?? {
    gaming: hardware.performance,
    creator: hardware.performance,
    ai: hardware.performance,
  };
  const modelReady = hardware.primaryModel?.status === "READY";

  return (
    <article className={styles["resultRow"]}>
      <div aria-hidden="true" className={styles["resultGlyph"]}>
        <HardwareCategoryIcon category={hardware.category} size={24} />
      </div>

      <div className={styles["identity"]}>
        <div className={styles["recordMeta"]}>
          <span>{hardware.brand}</span>
          <span>{hardwareCategoryLabels[hardware.category]}</span>
          <span data-state={modelReady ? "ready" : "placeholder"}>
            {modelReady ? <Cuboid size={11} /> : <Box size={11} />}
            {modelReady ? "3D READY" : "PROCEDURAL"}
          </span>
        </div>
        <h2>{hardware.name}</h2>
        <p>{formatHardwareSpec(hardware)}</p>
      </div>

      <fieldset aria-label="工作负载评分" className={styles["workloads"]}>
        {profileLabels.map(([key, label]) => (
          <span key={key}>
            <small>{label}</small>
            <i aria-hidden="true">
              <b style={{ width: `${profile[key]}%` }} />
            </i>
            <strong data-numeric="true">{profile[key]}</strong>
          </span>
        ))}
      </fieldset>

      <div className={styles["telemetry"]}>
        <span>
          <Gauge aria-hidden="true" size={13} />
          性能 <strong data-numeric="true">{hardware.performance}</strong>
        </span>
        <span>
          <Zap aria-hidden="true" size={13} />
          功耗 <strong data-numeric="true">{hardware.power}W</strong>
        </span>
      </div>

      <div className={styles["priceAction"]}>
        <span>
          <small>内部参考价</small>
          <strong data-numeric="true">¥{formatCurrency(hardware.price)}</strong>
        </span>
        <button
          onClick={() => {
            queueBuilderHardware(hardware.id);
            router.push("/builder");
          }}
          type="button"
        >
          <CheckCircle2 aria-hidden="true" size={15} />在 Builder 中使用
          <ChevronRight aria-hidden="true" size={14} />
        </button>
      </div>
    </article>
  );
}
