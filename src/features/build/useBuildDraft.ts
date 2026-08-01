"use client";

import { useCallback, useEffect, useState } from "react";
import { createBuildConfig, saveBuildConfig } from "@/features/builder/domain/BuildStorage";
import { useBuilderWorkspaceStore } from "@/features/builder/store/BuilderStoreProvider";

export type BuildSaveState = "clean" | "dirty" | "saving" | "saved" | "error";

type BuildDraftState = {
  readonly buildName: string;
  readonly saveState: BuildSaveState;
  readonly renameBuild: (name: string) => void;
  readonly saveBuild: () => Promise<void>;
};

const localBuildId = "local-v3-builder";

export function useBuildDraft(): BuildDraftState {
  const selectedComponents = useBuilderWorkspaceStore((state) => state.selectedComponents);
  const totalPrice = useBuilderWorkspaceStore((state) => state.totalPrice);
  const performance = useBuilderWorkspaceStore((state) => state.performanceScore);
  const revision = useBuilderWorkspaceStore((state) => state.feedback.revision);
  const [buildName, setBuildName] = useState("我的游戏主机");
  const [saveState, setSaveState] = useState<BuildSaveState>("clean");
  const [savedRevision, setSavedRevision] = useState(revision);

  useEffect(() => {
    if (revision !== savedRevision) {
      setSaveState("dirty");
    }
  }, [revision, savedRevision]);

  const renameBuild = useCallback((name: string) => {
    const nextName = name.trim();
    if (nextName.length === 0) {
      return;
    }
    setBuildName(nextName);
    setSaveState("dirty");
  }, []);

  const saveBuild = useCallback(async (): Promise<void> => {
    setSaveState("saving");
    await Promise.resolve();
    try {
      const config = createBuildConfig({
        id: localBuildId,
        name: buildName,
        createdAt: new Date().toISOString(),
        components: selectedComponents,
        price: totalPrice,
        performance,
      });
      saveBuildConfig(window.localStorage, config);
      setSavedRevision(revision);
      setSaveState("saved");
    } catch (error) {
      if (error instanceof Error) {
        setSaveState("error");
        return;
      }
      throw error;
    }
  }, [buildName, performance, revision, selectedComponents, totalPrice]);

  return {
    buildName,
    saveState,
    renameBuild,
    saveBuild,
  };
}
