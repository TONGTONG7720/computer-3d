import type { CameraView } from "../animation/CameraAnimation";
import type { RGBEffect } from "../materials/RGBSettings";
import type { ViewerMode } from "./engineTypes";

export const resolveCameraView = (
  mode: ViewerMode,
  detailRequested: boolean,
  installationActive: boolean,
): CameraView => {
  if (installationActive) {
    return "installation";
  }
  if (mode === "exploded") {
    return "exploded";
  }
  return detailRequested ? "detail" : "default";
};

export const shouldRenderContinuously = (mode: ViewerMode, effect: RGBEffect): boolean =>
  mode === "airflow" || (mode === "studio" && effect !== "static");
