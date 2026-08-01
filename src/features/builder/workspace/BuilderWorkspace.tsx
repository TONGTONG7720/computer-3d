"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BottomSheet } from "@/components/overlays/BottomSheet";
import { BuilderToolbar } from "@/features/build/BuilderToolbar";
import { BuildPanel } from "@/features/build/BuildPanel";
import { useBuildDraft } from "@/features/build/useBuildDraft";
import { hardwareCategories } from "@/features/builder/domain/hardware";
import { HardwareLibrary } from "@/features/hardware/HardwareLibrary";
import { useBuildQuote } from "@/features/price/builder/useBuildQuote";
import { BuilderDataSync } from "../store/BuilderDataSync";
import { BuilderStoreProvider, useBuilderWorkspaceStore } from "../store/BuilderStoreProvider";
import { ViewportLoader } from "../viewport/ViewportLoader";
import { WorkspaceMobileControls } from "./WorkspaceMobileControls";

type ActiveSheet = "components" | "summary" | null;

const LazyPriceComparisonDialog = dynamic(
  () =>
    import("@/features/price/builder/PriceComparisonDialog").then(
      (module) => module.PriceComparisonDialog,
    ),
  { ssr: false },
);

function BuilderWorkspaceContent() {
  const draft = useBuildDraft();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [priceOpen, setPriceOpen] = useState(false);
  const performance = useBuilderWorkspaceStore((state) => state.performanceScore.overall);
  const compatibility = useBuilderWorkspaceStore((state) => state.compatibilityStatus.status);
  const budget = useBuilderWorkspaceStore((state) => state.budget);
  const selectedComponents = useBuilderWorkspaceStore((state) => state.selectedComponents);
  const setBudget = useBuilderWorkspaceStore((state) => state.setBudget);
  const hardwareKeys = useMemo(
    () =>
      hardwareCategories.flatMap((category) => {
        const hardware = selectedComponents[category];
        return hardware === null ? [] : [hardware.id];
      }),
    [selectedComponents],
  );
  const quoteState = useBuildQuote(hardwareKeys);
  const openPrices = (): void => {
    setActiveSheet(null);
    setPriceOpen(true);
  };
  const buildPanel = <BuildPanel onOpenPrices={openPrices} quoteState={quoteState} />;

  return (
    <>
      <BuilderDataSync />
      <AppShell
        buildPanel={buildPanel}
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
              {buildPanel}
            </BottomSheet>
          </>
        }
        toolbar={
          <BuilderToolbar
            budget={budget}
            buildName={draft.buildName}
            compatibility={compatibility}
            onBuildNameChange={draft.renameBuild}
            onBudgetChange={setBudget}
            onOpenComponents={() => setActiveSheet("components")}
            onOpenSummary={() => setActiveSheet("summary")}
            onSave={() => void draft.saveBuild()}
            performance={performance}
            saveState={draft.saveState}
          />
        }
        viewport={<ViewportLoader />}
      />
      {priceOpen ? (
        <LazyPriceComparisonDialog
          onClose={() => setPriceOpen(false)}
          open
          selectedComponents={selectedComponents}
        />
      ) : null}
    </>
  );
}

export function BuilderWorkspace() {
  return (
    <BuilderStoreProvider>
      <BuilderWorkspaceContent />
    </BuilderStoreProvider>
  );
}
