"use client";

import { useEffect } from "react";
import { useBuilderWorkspaceStore } from "./BuilderStoreProvider";

export function BuilderDataSync() {
  const catalogueStatus = useBuilderWorkspaceStore((state) => state.catalogueStatus);
  const initializeCatalogue = useBuilderWorkspaceStore((state) => state.initializeCatalogue);
  const refreshAnalysis = useBuilderWorkspaceStore((state) => state.refreshAnalysis);
  const revision = useBuilderWorkspaceStore((state) => state.feedback.revision);

  useEffect(() => {
    void initializeCatalogue();
  }, [initializeCatalogue]);

  useEffect(() => {
    if (catalogueStatus === "ready" && revision >= 0) {
      void refreshAnalysis();
    }
  }, [catalogueStatus, refreshAnalysis, revision]);

  return null;
}
