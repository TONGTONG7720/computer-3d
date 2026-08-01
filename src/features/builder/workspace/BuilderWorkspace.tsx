"use client";

import { AppShell } from "@/components/layout/AppShell";
import { BuilderStoreProvider } from "../store/BuilderStoreProvider";

export function BuilderWorkspace() {
  return (
    <BuilderStoreProvider>
      <AppShell
        buildPanel={<p>配置分析</p>}
        componentLibrary={<p>硬件组件</p>}
        toolbar={<strong>PC LAB 3D</strong>}
        viewport={<p>3D 预览</p>}
      />
    </BuilderStoreProvider>
  );
}
