export type QualityProfileId = "desktop-high" | "desktop-balanced" | "mobile";

export type QualityProfile = {
  readonly id: QualityProfileId;
  readonly maxDpr: number;
  readonly shadows: boolean;
  readonly shadowMapSize: 1024 | 2048;
  readonly bloom: boolean;
  readonly antialias: boolean;
  readonly lodBias: number;
  readonly motionScale: 0 | 1;
};

export type QualityInput = {
  readonly devicePixelRatio: number;
  readonly viewportWidth: number;
  readonly reducedMotion: boolean;
};

export const selectQualityProfile = ({
  viewportWidth,
  reducedMotion,
}: QualityInput): QualityProfile => {
  const motionScale = reducedMotion ? 0 : 1;

  if (viewportWidth < 768) {
    return {
      id: "mobile",
      maxDpr: 1.25,
      shadows: true,
      shadowMapSize: 1024,
      bloom: false,
      antialias: false,
      lodBias: 1,
      motionScale,
    };
  }

  if (viewportWidth < 1280) {
    return {
      id: "desktop-balanced",
      maxDpr: 1.5,
      shadows: true,
      shadowMapSize: 1024,
      bloom: false,
      antialias: true,
      lodBias: 0.5,
      motionScale,
    };
  }

  return {
    id: "desktop-high",
    maxDpr: 1.5,
    shadows: true,
    shadowMapSize: 2048,
    bloom: true,
    antialias: true,
    lodBias: 0,
    motionScale,
  };
};
