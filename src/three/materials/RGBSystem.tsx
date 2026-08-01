"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Color } from "three";
import { setRgbColor } from "./RGBMaterial";
import { getRgbIntensity, type RGBSettings } from "./RGBSettings";

type RGBSystemProps = {
  readonly active: boolean;
  readonly settings: RGBSettings;
};

export function RGBSystem({ active, settings }: RGBSystemProps) {
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);
  const baseColor = useMemo(() => new Color(settings.color), [settings.color]);
  const animatedColor = useMemo(() => new Color(), []);

  useEffect(() => {
    setRgbColor(scene, baseColor, getRgbIntensity(settings, 0));
    invalidate();
  }, [baseColor, invalidate, scene, settings]);

  useFrame(({ clock }) => {
    if (!active || settings.effect === "static") {
      return;
    }
    const elapsed = clock.getElapsedTime();
    if (settings.effect === "wave") {
      animatedColor.copy(baseColor).offsetHSL((elapsed * settings.speed * 0.08) % 1, 0, 0);
      setRgbColor(scene, animatedColor, getRgbIntensity(settings, elapsed));
      return;
    }
    setRgbColor(scene, baseColor, getRgbIntensity(settings, elapsed));
  });

  return null;
}
