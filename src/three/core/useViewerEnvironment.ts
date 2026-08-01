"use client";

import { useEffect, useState } from "react";
import { type QualityProfile, selectQualityProfile } from "./QualityManager";

export type ViewerEnvironment = {
  readonly profile: QualityProfile;
  readonly reducedMotion: boolean;
};

const readEnvironment = (): ViewerEnvironment => {
  const browserAvailable = typeof window !== "undefined";
  const reducedMotion = browserAvailable
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  return {
    profile: selectQualityProfile({
      devicePixelRatio: browserAvailable ? window.devicePixelRatio : 1,
      viewportWidth: browserAvailable ? window.innerWidth : 1440,
      reducedMotion,
    }),
    reducedMotion,
  };
};

export const useViewerEnvironment = (): ViewerEnvironment => {
  const [environment, setEnvironment] = useState(readEnvironment);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (): void => setEnvironment(readEnvironment());
    window.addEventListener("resize", update);
    media.addEventListener("change", update);
    return () => {
      window.removeEventListener("resize", update);
      media.removeEventListener("change", update);
    };
  }, []);

  return environment;
};
