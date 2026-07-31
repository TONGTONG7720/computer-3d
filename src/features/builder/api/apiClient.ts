import ky, { type KyInstance } from "ky";

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");

export const hardwarePlatformApiUrl = trimTrailingSlashes(
  process.env["NEXT_PUBLIC_PC_LAB_API_URL"] ?? "http://127.0.0.1:8088/api",
);

export const createHardwarePlatformClient = (
  prefixUrl: string = hardwarePlatformApiUrl,
): KyInstance =>
  ky.create({
    prefix: trimTrailingSlashes(prefixUrl),
    timeout: 8_000,
    retry: {
      limit: 2,
      methods: ["get"],
    },
    headers: {
      Accept: "application/json",
    },
  });

export const hardwarePlatformClient = createHardwarePlatformClient();

export const resolveHardwareModelUrl = (
  modelUrl: string,
  apiUrl: string = hardwarePlatformApiUrl,
): string => {
  if (!modelUrl.startsWith("/assets/models/")) {
    return modelUrl;
  }
  return new URL(modelUrl, new URL(apiUrl).origin).toString();
};
