"use client";

import { AppShell } from "@/components/layout/AppShell";
import { BuilderToolbar } from "@/features/build/BuilderToolbar";
import { useBuildDraft } from "@/features/build/useBuildDraft";
import { HardwareLibrary } from "@/features/hardware/HardwareLibrary";
import { BuilderStoreProvider, useBuilderWorkspaceStore } from "../store/BuilderStoreProvider";

function BuilderWorkspaceContent() {
  const draft = useBuildDraft();
  const performance = useBuilderWorkspaceStore((state) => state.performanceScore.overall);
  const compatibility = useBuilderWorkspaceStore((state) => state.compatibilityStatus.status);

  return (
    <AppShell
      buildPanel={<p>配置分析</p>}
      componentLibrary={<HardwareLibrary />}
      toolbar={
        <BuilderToolbar
          budget={30000}
          buildName={draft.buildName}
          compatibility={compatibility}
          onBuildNameChange={draft.renameBuild}
          onSave={() => void draft.saveBuild()}
          performance={performance}
          saveState={draft.saveState}
        />
      }
      viewport={<p>3D 预览</p>}
    />
  );
}

export function BuilderWorkspace() {
  return (
    <BuilderStoreProvider>
      <BuilderWorkspaceContent />
    </BuilderStoreProvider>
  );
}
