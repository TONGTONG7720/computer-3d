"use client";

import { useEffect } from "react";
import { consumeBuilderHardware } from "@/features/hardware/explorer/builderHandoff";
import { useBuilderWorkspaceStore } from "./BuilderStoreProvider";

export function BuilderDataSync() {
  const catalogueStatus = useBuilderWorkspaceStore((state) => state.catalogueStatus);
  const initializeCatalogue = useBuilderWorkspaceStore((state) => state.initializeCatalogue);
  const refreshAnalysis = useBuilderWorkspaceStore((state) => state.refreshAnalysis);
  const revision = useBuilderWorkspaceStore((state) => state.feedback.revision);
  const catalogue = useBuilderWorkspaceStore((state) => state.catalogue);
  const selectHardware = useBuilderWorkspaceStore((state) => state.selectHardware);

  useEffect(() => {
    if (catalogueStatus !== "ready") {
      return;
    }
    const hardwareId = consumeBuilderHardware();
    const hardware = catalogue.find((candidate) => candidate.id === hardwareId);
    if (hardware !== undefined) {
      selectHardware(hardware);
    }
  }, [catalogue, catalogueStatus, selectHardware]);

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
