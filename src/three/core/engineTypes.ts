export const viewerModes = ["build", "exploded", "airflow", "studio"] as const;
export type ViewerMode = (typeof viewerModes)[number];

export type ViewerRuntimeStatus =
  | { readonly kind: "loading"; readonly label: string; readonly progress: number }
  | { readonly kind: "ready"; readonly label: string }
  | { readonly kind: "degraded"; readonly label: string }
  | { readonly kind: "error"; readonly label: string };
