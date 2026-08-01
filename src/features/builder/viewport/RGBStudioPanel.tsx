"use client";

import type { RGBEffect } from "@/three/materials/RGBSettings";
import styles from "./ThreeDViewport.module.css";

const rgbEffects = ["static", "pulse", "wave"] as const satisfies readonly RGBEffect[];

type RGBStudioPanelProps = {
  readonly brightness: number;
  readonly color: string;
  readonly effect: RGBEffect;
  readonly onBrightnessChange: (brightness: number) => void;
  readonly onColorChange: (color: string) => void;
  readonly onEffectChange: (effect: RGBEffect) => void;
  readonly onSpeedChange: (speed: number) => void;
  readonly speed: number;
};

export function RGBStudioPanel({
  brightness,
  color,
  effect,
  onBrightnessChange,
  onColorChange,
  onEffectChange,
  onSpeedChange,
  speed,
}: RGBStudioPanelProps) {
  return (
    <aside aria-label="RGB Studio" className={styles["rgbPanel"]}>
      <div className={styles["rgbHeader"]}>
        <span>RGB STUDIO</span>
        <strong>{Math.round(brightness * 100)}%</strong>
      </div>
      <label className={styles["colorField"]}>
        <span>颜色</span>
        <input
          aria-label="RGB 颜色"
          onChange={(event) => onColorChange(event.currentTarget.value)}
          type="color"
          value={color}
        />
      </label>
      <fieldset className={styles["effectGroup"]}>
        <legend>RGB 灯效</legend>
        <div aria-label="RGB 灯效" role="radiogroup">
          {rgbEffects.map((effectId) => (
            <label data-active={effect === effectId} key={effectId}>
              <input
                checked={effect === effectId}
                name="rgb-effect"
                onChange={() => onEffectChange(effectId)}
                type="radio"
                value={effectId}
              />
              <span>{effectId}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className={styles["rangeField"]}>
        <span>亮度</span>
        <input
          max="1"
          min="0.1"
          onChange={(event) => onBrightnessChange(event.currentTarget.valueAsNumber)}
          step="0.05"
          type="range"
          value={brightness}
        />
      </label>
      <label className={styles["rangeField"]}>
        <span>速度</span>
        <input
          disabled={effect === "static"}
          max="2"
          min="0.25"
          onChange={(event) => onSpeedChange(event.currentTarget.valueAsNumber)}
          step="0.05"
          type="range"
          value={speed}
        />
      </label>
    </aside>
  );
}
