import { Check, ChevronRight, Gauge, ShieldCheck, Zap } from "lucide-react";
import {
  type Hardware,
  type HardwareCategory,
  hardwareCategories,
} from "@/features/builder/domain/hardware";
import type { AiBuild } from "../domain/aiBuild";
import styles from "./AiProposalCard.module.css";

const categoryLabels: Readonly<Record<HardwareCategory, string>> = {
  cpu: "CPU",
  gpu: "GPU",
  motherboard: "BOARD",
  ram: "MEMORY",
  storage: "STORAGE",
  cooling: "THERMAL",
  power_supply: "POWER",
  case: "CHASSIS",
};

type AiProposalCardProps = {
  readonly applying: boolean;
  readonly applied: boolean;
  readonly catalogue: readonly Hardware[];
  readonly onApply: () => void;
  readonly proposal: AiBuild;
};

export function AiProposalCard({
  applied,
  applying,
  catalogue,
  onApply,
  proposal,
}: AiProposalCardProps) {
  const componentRows = hardwareCategories.map((category) => {
    const id = proposal.components[category];
    return {
      category,
      hardware: catalogue.find((candidate) => candidate.id === id),
      id,
    };
  });

  return (
    <article className={styles["proposal"]}>
      <header className={styles["proposalHeader"]}>
        <div>
          <span>PROPOSAL / {proposal.configId.slice(0, 8).toUpperCase()}</span>
          <strong>¥{proposal.totalPrice.toLocaleString("zh-CN")}</strong>
        </div>
        <span className={styles["compatibility"]} data-status={proposal.compatibilityStatus}>
          <ShieldCheck size={13} />
          {proposal.compatibilityStatus}
        </span>
      </header>

      <div className={styles["metricRail"]}>
        <div>
          <Gauge size={14} />
          <span>用途性能</span>
          <strong>{proposal.performanceScore}</strong>
        </div>
        <div>
          <Zap size={14} />
          <span>预测功耗</span>
          <strong>{proposal.powerUsageWatt}W</strong>
        </div>
      </div>

      <div className={styles["componentMatrix"]}>
        {componentRows.map(({ category, hardware, id }) => (
          <div className={styles["componentRow"]} key={category}>
            <span>{categoryLabels[category]}</span>
            <strong>{hardware?.name ?? id}</strong>
            <Check size={12} />
          </div>
        ))}
      </div>

      {proposal.changedDependencies.length > 0 ? (
        <section className={styles["dependencyNotice"]}>
          <span>DEPENDENCY ADJUSTMENT</span>
          {proposal.changedDependencies.map((change) => (
            <p key={`${change.category}-${change.selectedHardwareId}`}>
              <strong>{categoryLabels[change.category]}</strong>
              <span>{change.previousHardwareId}</span>
              <ChevronRight size={12} />
              <span>{change.selectedHardwareId}</span>
            </p>
          ))}
        </section>
      ) : null}

      {proposal.knowledgeSources.length > 0 ? (
        <div className={styles["sourceRail"]}>
          <span>依据</span>
          {proposal.knowledgeSources.map((source) => (
            <small key={source.sourceKey}>{source.title}</small>
          ))}
        </div>
      ) : null}

      <details className={styles["evidence"]}>
        <summary>为什么这样配置</summary>
        <div>
          {Object.entries(proposal.componentReasons).map(([category, reason]) => (
            <p key={category}>
              <strong>{category.toUpperCase()}</strong>
              <span>{reason}</span>
            </p>
          ))}
          {proposal.knowledgeSources.map((source) => (
            <small key={source.sourceKey}>
              SOURCE {source.sourceKey} · R{source.revision}
            </small>
          ))}
        </div>
      </details>

      {proposal.unfulfilledPreferences.length > 0 ? (
        <div className={styles["preferenceNote"]}>{proposal.unfulfilledPreferences.join("；")}</div>
      ) : null}

      {proposal.budgetShortfall > 0 ? (
        <div className={styles["preferenceNote"]}>
          预算缺口 ¥{proposal.budgetShortfall.toLocaleString("zh-CN")}
        </div>
      ) : null}

      {proposal.requiresConfirmation && !applied ? (
        <button
          className={styles["applyButton"]}
          disabled={applying}
          onClick={onApply}
          type="button"
        >
          {applying ? "正在写入安装队列" : "应用整套调整"}
          <ChevronRight size={15} />
        </button>
      ) : null}
    </article>
  );
}
