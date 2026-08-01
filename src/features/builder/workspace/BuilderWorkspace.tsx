"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BottomSheet } from "@/components/overlays/BottomSheet";
import { BuilderToolbar } from "@/features/build/BuilderToolbar";
import { BuildPanel } from "@/features/build/BuildPanel";
import { useBuildDraft } from "@/features/build/useBuildDraft";
import { HardwareLibrary } from "@/features/hardware/HardwareLibrary";
import { BuilderStoreProvider, useBuilderWorkspaceStore } from "../store/BuilderStoreProvider";
import { ViewportLoader } from "../viewport/ViewportLoader";
import { WorkspaceMobileControls } from "./WorkspaceMobileControls";

type ActiveSheet = "components" | "summary" | null;

function BuilderWorkspaceContent() {
  const draft = useBuildDraft();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const performance = useBuilderWorkspaceStore((state) => state.performanceScore.overall);
  const compatibility = useBuilderWorkspaceStore((state) => state.compatibilityStatus.status);

  return (
    <AppShell
      buildPanel={<BuildPanel />}
      componentLibrary={<HardwareLibrary />}
      mobileControls={
        <>
          <WorkspaceMobileControls
            onOpenComponents={() => setActiveSheet("components")}
            onOpenSummary={() => setActiveSheet("summary")}
          />
          <BottomSheet
            onClose={() => setActiveSheet(null)}
            open={activeSheet === "components"}
            side="left"
            title="选择组件"
          >
            <HardwareLibrary />
          </BottomSheet>
          <BottomSheet
            onClose={() => setActiveSheet(null)}
            open={activeSheet === "summary"}
            side="right"
            size="full"
            title="配置分析"
          >
            <BuildPanel />
          </BottomSheet>
        </>
      }
      toolbar={
        <BuilderToolbar
          budget={30000}
          buildName={draft.buildName}
          compatibility={compatibility}
          onBuildNameChange={draft.renameBuild}
          onOpenComponents={() => setActiveSheet("components")}
          onOpenSummary={() => setActiveSheet("summary")}
          onSave={() => void draft.saveBuild()}
          performance={performance}
          saveState={draft.saveState}
        />
      }
      viewport={<ViewportLoader />}
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
