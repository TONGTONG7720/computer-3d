"use client";

import {
  Activity,
  Box,
  Check,
  CircuitBoard,
  Cpu,
  Database,
  Focus,
  Layers3,
  Lightbulb,
  MousePointer2,
  Move3d,
  RotateCcw,
  ShieldCheck,
  ZoomIn,
} from "lucide-react";
import type { ComponentType as ReactComponentType } from "react";
import { isReplacementBusy, useEngineStore } from "@/store/engineStore";
import {
  type DemoReplaceableHardware,
  demoCpuOptions,
  demoGpuOptions,
} from "@/three/demo/demoHardware";
import { PCViewer } from "@/three/viewer/PCViewer";
import styles from "./EngineDemo.module.css";

const componentLabels = {
  case: "Future Glass Case",
  motherboard: "Z790 LAB",
  cpu: "Processor",
  gpu: "Graphics",
  ram: "DDR5 64GB",
  storage: "NVMe 4TB",
  cooling: "LAB AIO 360",
  fan: "Spectral Fans",
  power_supply: "1200W Platinum",
} as const;

const phaseLabels = {
  idle: "Engine ready",
  preparing: "Preparing slot",
  loading: "Loading model",
  removing: "Removing component",
  installing: "Installing component",
  locked: "Component locked",
  failed: "Replacement failed",
} as const;

type HardwareSectionProps = {
  readonly icon: ReactComponentType<{ size?: number; strokeWidth?: number }>;
  readonly label: string;
  readonly options: readonly DemoReplaceableHardware[];
  readonly selectedId: string;
  readonly busy: boolean;
};

function HardwareSection({ icon: Icon, label, options, selectedId, busy }: HardwareSectionProps) {
  const requestReplacement = useEngineStore((state) => state.requestReplacement);

  return (
    <section className={styles["hardwareSection"]}>
      <div className={styles["sectionTitle"]}>
        <Icon size={15} strokeWidth={1.7} />
        <span>{label}</span>
      </div>
      <div className={styles["optionList"]}>
        {options.map((option) => {
          const selected = selectedId === option.id;
          return (
            <button
              aria-pressed={selected}
              className={styles["hardwareOption"]}
              data-selected={selected}
              disabled={busy || selected}
              key={option.id}
              onClick={() => {
                requestReplacement({
                  slot: option.slot,
                  assetId: option.id,
                  modelUrl: option.manifest.url,
                  variant: option.variant,
                });
              }}
              type="button"
            >
              <span className={styles["hardwareGlyph"]}>
                {option.slot === "cpu" ? (
                  <Cpu size={19} strokeWidth={1.5} />
                ) : (
                  <CircuitBoard size={19} strokeWidth={1.5} />
                )}
              </span>
              <span className={styles["hardwareCopy"]}>
                <strong>{option.name}</strong>
                <small>{option.descriptor}</small>
              </span>
              <span className={styles["performanceTag"]}>{option.performance}</span>
              <span className={styles["selectionMark"]}>
                {selected ? <Check size={13} strokeWidth={2.2} /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type ToolButtonProps = {
  readonly active?: boolean;
  readonly icon: ReactComponentType<{ size?: number; strokeWidth?: number }>;
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
  const selectedHardware = useEngineStore((state) => state.selectedHardware);
  const selectedComponent = useEngineStore((state) => state.selectedComponent);
  const exploded = useEngineStore((state) => state.exploded);
  const rgbMode = useEngineStore((state) => state.rgbMode);
  const cameraMode = useEngineStore((state) => state.cameraMode);
  const replacementState = useEngineStore((state) => state.replacementState);
  const loading = useEngineStore((state) => state.loading);
  const toggleExploded = useEngineStore((state) => state.toggleExploded);
  const cycleRgb = useEngineStore((state) => state.cycleRgb);
  const resetCamera = useEngineStore((state) => state.resetCamera);
  const focusInternal = useEngineStore((state) => state.focusInternal);
  const busy = isReplacementBusy(replacementState.phase);

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
            <small>3D ENGINE</small>
          </span>
        </div>
        <div aria-live="polite" className={styles["engineStatus"]}>
          <span className={styles["statusPulse"]} data-busy={busy} />
          <span>{phaseLabels[replacementState.phase]}</span>
        </div>
        <div className={styles["version"]}>
          <span>CORE SYSTEM</span>
          <strong>V1.0</strong>
        </div>
      </header>

      <aside
        aria-label="Component selector"
        className={`${styles["panel"]} ${styles["componentPanel"]}`}
      >
        <div className={styles["panelHeader"]}>
          <p>COMPONENT BAY</p>
          <h1>Build architecture</h1>
          <span>Replace core hardware in real time.</span>
        </div>
        <div className={styles["hardwareSections"]}>
          <HardwareSection
            busy={busy}
            icon={Cpu}
            label="CPU"
            options={demoCpuOptions}
            selectedId={selectedHardware.cpu}
          />
          <HardwareSection
            busy={busy}
            icon={CircuitBoard}
            label="GPU"
            options={demoGpuOptions}
            selectedId={selectedHardware.gpu}
          />
        </div>
        <div className={styles["panelFootnote"]}>
          <Database size={14} strokeWidth={1.6} />
          <span>GLB stream ready · fallback geometry active</span>
        </div>
      </aside>

      <aside
        aria-label="Engine telemetry"
        className={`${styles["panel"]} ${styles["telemetryPanel"]}`}
      >
        <div className={styles["telemetryLead"]}>
          <p>SELECTED OBJECT</p>
          <div className={styles["telemetryTitle"]}>
            <span className={styles["scanIcon"]}>
              <Focus size={17} strokeWidth={1.6} />
            </span>
            <div>
              <strong>
                {selectedComponent === null ? "PC assembly" : componentLabels[selectedComponent]}
              </strong>
              <small>
                {selectedComponent === null ? "All systems visible" : selectedComponent}
              </small>
            </div>
          </div>
        </div>

        <div className={styles["telemetryGrid"]}>
          <div>
            <span>FRAME TARGET</span>
            <strong>60 FPS</strong>
          </div>
          <div>
            <span>MOTION</span>
            <strong>GSAP</strong>
          </div>
          <div>
            <span>VIEW</span>
            <strong>{exploded ? "EXPLODED" : cameraMode.toUpperCase()}</strong>
          </div>
          <div>
            <span>RGB BUS</span>
            <strong>{rgbMode.toUpperCase()}</strong>
          </div>
        </div>

        <div className={styles["streamStatus"]}>
          <div className={styles["streamHeading"]}>
            <span>MODEL STREAM</span>
            <strong>{Math.round(loading.progress * 100)}%</strong>
          </div>
          <span className={styles["progressTrack"]}>
            <span style={{ "--stream-progress": loading.progress } as React.CSSProperties} />
          </span>
          <small>{loading.label}</small>
        </div>

        <div className={styles["controlLegend"]}>
          <p>VIEWPORT CONTROL</p>
          <div>
            <MousePointer2 size={15} />
            <span>Left drag</span>
            <strong>Rotate</strong>
          </div>
          <div>
            <ZoomIn size={15} />
            <span>Wheel</span>
            <strong>Zoom</strong>
          </div>
          <div>
            <Move3d size={15} />
            <span>Right drag</span>
            <strong>Pan</strong>
          </div>
        </div>

        <div className={styles["safetyStatus"]}>
          <ShieldCheck size={16} strokeWidth={1.7} />
          <span>
            <strong>Resource guard active</strong>
            <small>Cache · disposal · mobile LOD</small>
          </span>
        </div>
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
          LIVE SCENE / XYZ
        </span>
      </div>
    </main>
  );
}
