export type RGBEffect = "static" | "pulse" | "wave";

export type RGBSettings = {
  readonly brightness: number;
  readonly color: string;
  readonly effect: RGBEffect;
  readonly speed: number;
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

export const normalizeRgbSettings = (settings: RGBSettings): RGBSettings => ({
  brightness: clamp(settings.brightness, 0.1, 1),
  color: settings.color.toLowerCase(),
  effect: settings.effect,
  speed: clamp(settings.speed, 0.25, 2),
});

export const getRgbIntensity = (settings: RGBSettings, elapsedSeconds: number): number => {
  if (settings.effect === "static" || settings.effect === "wave") {
    return settings.brightness * 1.8;
  }
  const pulse = 1.15 + Math.sin(elapsedSeconds * settings.speed * Math.PI * 2) * 0.45;
  return settings.brightness * pulse;
};
