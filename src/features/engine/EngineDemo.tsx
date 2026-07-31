"use client";

import { Activity, Box, Focus, Layers3, Lightbulb, RotateCcw } from "lucide-react";
import type { ComponentType } from "react";
import { BuildSummary } from "@/features/builder/components/BuildSummary";
import { ComponentSelector } from "@/features/builder/components/ComponentSelector";
import { isReplacementBusy, useEngineStore } from "@/store/engineStore";
import { PCViewer } from "@/three/viewer/PCViewer";
import styles from "./EngineDemo.module.css";

const phaseLabels = {
  idle: "Builder ready",
  preparing: "Preparing slot",
  loading: "Loading model",
  removing: "Removing component",
  installing: "Installing component",
  locked: "Component locked",
  failed: "Replacement failed",
} as const;

type ToolButtonProps = {
  readonly active?: boolean;
  readonly icon: ComponentType<{ readonly size?: number; readonly strokeWidth?: number }>;
  readonly label: string;
  readonly onClick: () => void;
};

function ToolButton({ active = false, icon: Icon, label, onClick }: ToolButtonProps) {
  return (
    <button
      aria-pressed={active}
      className={styles["toolButton"]}
      data-active={active}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon size={18} strokeWidth={1.65} />
      <span>{label}</span>
    </button>
  );
}

export function EngineDemo() {
  const exploded = useEngineStore((state) => state.exploded);
  const rgbMode = useEngineStore((state) => state.rgbMode);
  const cameraMode = useEngineStore((state) => state.cameraMode);
  const replacementState = useEngineStore((state) => state.replacementState);
  const replacementRequest = useEngineStore((state) => state.replacementRequest);
  const replacementQueue = useEngineStore((state) => state.replacementQueue);
  const toggleExploded = useEngineStore((state) => state.toggleExploded);
  const cycleRgb = useEngineStore((state) => state.cycleRgb);
  const resetCamera = useEngineStore((state) => state.resetCamera);
  const focusInternal = useEngineStore((state) => state.focusInternal);
  const busy = isReplacementBusy(replacementState.phase) || replacementRequest !== null;

  return (
    <main className={styles["engine"]}>
      <PCViewer />

      <header className={styles["header"]}>
        <div className={styles["brand"]}>
          <span className={styles["brandMark"]}>
            <Box size={19} strokeWidth={1.55} />
          </span>
          <span>
            <strong>PC LAB</strong>
            <small>3D BUILDER</small>
          </span>
        </div>
        <div aria-live="polite" className={styles["engineStatus"]}>
          <span className={styles["statusPulse"]} data-busy={busy} />
          <span>{phaseLabels[replacementState.phase]}</span>
          {replacementQueue.length > 0 ? <strong>+{replacementQueue.length} QUEUED</strong> : null}
        </div>
        <div className={styles["version"]}>
          <span>BUILDER SYSTEM</span>
          <strong>V1.0</strong>
        </div>
      </header>

      <aside
        aria-label="Component selector"
        className={`${styles["panel"]} ${styles["componentPanel"]}`}
      >
        <ComponentSelector />
      </aside>

      <aside aria-label="Build summary" className={`${styles["panel"]} ${styles["summaryPanel"]}`}>
        <BuildSummary />
      </aside>

      <nav aria-label="3D viewer tools" className={styles["toolbar"]}>
        <ToolButton icon={RotateCcw} label="Reset" onClick={resetCamera} />
        <ToolButton
          active={cameraMode === "internal"}
          icon={Focus}
          label="Internal"
          onClick={focusInternal}
        />
        <ToolButton
          active={exploded}
          icon={Layers3}
          label={exploded ? "Assemble" : "Explode"}
          onClick={toggleExploded}
        />
        <ToolButton
          active={rgbMode !== "off"}
          icon={Lightbulb}
          label={`RGB ${rgbMode}`}
          onClick={cycleRgb}
        />
      </nav>

      <div aria-hidden="true" className={styles["hudFrame"]}>
        <span className={styles["hudTopLeft"]} />
        <span className={styles["hudTopRight"]} />
        <span className={styles["hudBottomLeft"]} />
        <span className={styles["hudBottomRight"]} />
        <span className={styles["axisLabel"]}>
          <Activity size={13} />
          LIVE CONFIG / XYZ
        </span>
      </div>
    </main>
  );
}
