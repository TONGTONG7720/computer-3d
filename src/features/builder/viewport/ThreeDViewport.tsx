"use client";

import { Focus, Maximize2, MousePointer2, RotateCcw } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useBuilderWorkspaceStore } from "@/features/builder/store/BuilderStoreProvider";
import type { CameraView } from "@/three/animation/CameraAnimation";
import type { ViewerMode, ViewerRuntimeStatus } from "@/three/core/engineTypes";
import { resolveCameraView } from "@/three/core/ViewerRuntime";
import type { RGBEffect } from "@/three/materials/RGBSettings";
import type { PCSlotId } from "@/three/pc/slots";
import { BuilderPCViewer } from "@/three/viewer/BuilderPCViewer";
import { RGBStudioPanel } from "./RGBStudioPanel";
import styles from "./ThreeDViewport.module.css";

const viewportModes = ["build", "exploded", "airflow", "studio"] as const;
const modeLabels = {
  build: "Build",
  exploded: "Exploded",
  airflow: "Airflow",
  studio: "Studio",
} as const satisfies Readonly<Record<ViewerMode, string>>;

type ThreeDViewportProps = {
  readonly loading?: boolean;
};

export function ThreeDViewport({ loading = false }: ThreeDViewportProps) {
  const selectedComponents = useBuilderWorkspaceStore((state) => state.selectedComponents);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ViewerMode>("build");
  const [detailRequested, setDetailRequested] = useState(false);
  const [cameraRevision, setCameraRevision] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<PCSlotId | null>(null);
  const [status, setStatus] = useState<ViewerRuntimeStatus>({
    kind: "loading",
    label: "正在准备 3D 引擎",
    progress: 0,
  });
  const [rgbColor, setRgbColor] = useState("#48d8ff");
  const [rgbBrightness, setRgbBrightness] = useState(0.82);
  const [rgbEffect, setRgbEffect] = useState<RGBEffect>("static");
  const [rgbSpeed, setRgbSpeed] = useState(1);
  const cameraView = useMemo<CameraView>(
    () => resolveCameraView(mode, detailRequested, false),
    [detailRequested, mode],
  );
  const updateStatus = useCallback((next: ViewerRuntimeStatus) => setStatus(next), []);

  const changeMode = (nextMode: ViewerMode): void => {
    setMode(nextMode);
    setDetailRequested(false);
    setCameraRevision((revision) => revision + 1);
  };

  const resetCamera = (): void => {
    setDetailRequested(false);
    setCameraRevision((revision) => revision + 1);
  };

  const toggleFullscreen = (): void => {
    const viewport = viewportRef.current;
    if (viewport === null || typeof viewport.requestFullscreen !== "function") {
      return;
    }
    void viewport.requestFullscreen();
  };

  return (
    <div className={styles["viewport"]} ref={viewportRef}>
      <nav aria-label="预览模式" className={styles["modeSwitcher"]}>
        {viewportModes.map((modeId) => (
          <button
            aria-label={`${modeLabels[modeId]} 模式`}
            aria-pressed={mode === modeId}
            data-active={mode === modeId}
            key={modeId}
            onClick={() => changeMode(modeId)}
            type="button"
          >
            {modeLabels[modeId]}
          </button>
        ))}
      </nav>

      <section aria-label="3D 电脑工作区" className={styles["cameraStage"]}>
        <span aria-hidden="true" className={styles["cameraFrame"]}>
          <span />
        </span>
        <BuilderPCViewer
          cameraRevision={cameraRevision}
          cameraView={cameraView}
          mode={mode}
          onSelect={setSelectedSlot}
          onStatus={updateStatus}
          rgbSettings={{
            brightness: rgbBrightness,
            color: rgbColor,
            effect: rgbEffect,
            speed: rgbSpeed,
          }}
          selectedComponents={selectedComponents}
          selectedSlot={selectedSlot}
        />
      </section>

      {mode === "studio" ? (
        <RGBStudioPanel
          brightness={rgbBrightness}
          color={rgbColor}
          effect={rgbEffect}
          onBrightnessChange={setRgbBrightness}
          onColorChange={setRgbColor}
          onEffectChange={setRgbEffect}
          onSpeedChange={setRgbSpeed}
          speed={rgbSpeed}
        />
      ) : null}

      <div aria-label="摄像机控制" className={styles["cameraControls"]} role="toolbar">
        <button aria-label="重置镜头" onClick={resetCamera} type="button">
          <RotateCcw aria-hidden="true" size={16} strokeWidth={1.6} />
          重置
        </button>
        <button
          aria-label="内部聚焦"
          aria-pressed={detailRequested}
          onClick={() => setDetailRequested((requested) => !requested)}
          type="button"
        >
          <Focus aria-hidden="true" size={16} strokeWidth={1.6} />
          内部聚焦
        </button>
        <button aria-label="全屏查看" onClick={toggleFullscreen} type="button">
          <Maximize2 aria-hidden="true" size={16} strokeWidth={1.6} />
          全屏
        </button>
      </div>

      <div aria-live="polite" className={styles["stageStatus"]} role="status">
        <span data-state={loading ? "loading" : status.kind} />
        {loading ? "正在准备 3D 引擎" : status.label}
      </div>
      <div className={styles["interactionHint"]}>
        <MousePointer2 aria-hidden="true" size={14} strokeWidth={1.5} />
        左键旋转 · 滚轮缩放 · 右键平移
      </div>
    </div>
  );
}
