"use client";

import dynamic from "next/dynamic";
import styles from "./ViewportLoader.module.css";

const LazyThreeDViewport = dynamic(
  () => import("./ThreeDViewport").then((module) => module.ThreeDViewport),
  {
    ssr: false,
    loading: () => (
      <div className={styles["loading"]} role="status">
        <span aria-hidden="true" />
        <strong>正在载入视口模块</strong>
        <small>3D 引擎保持独立，不阻塞 Builder 控件。</small>
      </div>
    ),
  },
);

export function ViewportLoader() {
  return <LazyThreeDViewport />;
}
