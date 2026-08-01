"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Focus, Maximize2, MousePointer2, RotateCcw, ScanLine } from "lucide-react";
import { useState } from "react";
import styles from "./ThreeDViewport.module.css";

const viewportModeOrder = ["build", "exploded", "airflow", "studio"] as const;
export type ViewportMode = (typeof viewportModeOrder)[number];

const viewportModeContent = {
  build: {
    label: "Build",
    title: "装机视图",
    description: "完整机箱、插槽定位和安装反馈将在 3D 集成阶段接入。",
  },
  exploded: {
    label: "Exploded",
    title: "拆解预览",
    description: "GPU、内存、散热和主板的物理解构轴已预留。",
  },
  airflow: {
    label: "Airflow",
    title: "风道预览",
    description: "冷气流、热气流和预测温区将在真实场景中显示。",
  },
  studio: {
    label: "Studio",
    title: "外观工作室",
    description: "RGB、机箱颜色和玻璃预览将在真实材质接入后启用。",
  },
} as const satisfies Readonly<
  Record<
    ViewportMode,
    { readonly label: string; readonly title: string; readonly description: string }
  >
>;

type ThreeDViewportProps = {
  readonly loading?: boolean;
};

export function ThreeDViewport({ loading = false }: ThreeDViewportProps) {
  const [mode, setMode] = useState<ViewportMode>("build");
  const content = viewportModeContent[mode];

  return (
    <div className={styles["viewport"]}>
      <nav aria-label="预览模式" className={styles["modeSwitcher"]}>
        {viewportModeOrder.map((modeId) => (
          <button
            aria-label={`${viewportModeContent[modeId].label} 模式`}
            aria-pressed={mode === modeId}
            data-active={mode === modeId}
            key={modeId}
            onClick={() => setMode(modeId)}
            type="button"
          >
            {viewportModeContent[modeId].label}
          </button>
        ))}
      </nav>

      <section aria-label="3D 摄像机占位区域" className={styles["cameraStage"]}>
        <span aria-hidden="true" className={styles["cameraFrame"]}>
          <span />
        </span>
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={styles["placeholder"]}
            exit={{ opacity: 0, y: -4 }}
            initial={{ opacity: 0, y: 4 }}
            key={mode}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <ScanLine aria-hidden="true" size={28} strokeWidth={1.25} />
            <small>3D VIEWPORT RESERVED</small>
            <h1>{loading ? "正在准备视口" : content.title}</h1>
            <p>{loading ? "独立视口模块正在载入，布局尺寸保持不变。" : content.description}</p>
            <strong>真实模型将在下一阶段接入</strong>
          </motion.div>
        </AnimatePresence>
      </section>

      <div aria-label="摄像机控制" className={styles["cameraControls"]} role="toolbar">
        <button disabled title="接入 3D 后可用" type="button">
          <RotateCcw aria-hidden="true" size={16} strokeWidth={1.6} />
          重置
        </button>
        <button disabled title="接入 3D 后可用" type="button">
          <Focus aria-hidden="true" size={16} strokeWidth={1.6} />
          内部聚焦
        </button>
        <button disabled title="接入 3D 后可用" type="button">
          <Maximize2 aria-hidden="true" size={16} strokeWidth={1.6} />
          全屏
        </button>
      </div>

      <div aria-live="polite" className={styles["stageStatus"]} role="status">
        <span data-loading={loading} />
        {loading ? "正在准备视口" : "视口占位 · UI 模式可用"}
      </div>
      <div className={styles["interactionHint"]}>
        <MousePointer2 aria-hidden="true" size={14} strokeWidth={1.5} />
        旋转 / 缩放 / 平移将在 3D 阶段启用
      </div>
    </div>
  );
}
