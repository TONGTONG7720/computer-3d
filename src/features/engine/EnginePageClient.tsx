"use client";

import dynamic from "next/dynamic";
import styles from "./EngineDemo.module.css";

const EngineDemo = dynamic(() => import("./EngineDemo").then((module) => module.EngineDemo), {
  ssr: false,
  loading: () => (
    <main className={styles["engineLoading"]}>
      <div>
        <span />
        <p>PC LAB / INITIALIZING THREE.JS ENGINE</p>
      </div>
    </main>
  ),
});

export function EnginePageClient() {
  return <EngineDemo />;
}
