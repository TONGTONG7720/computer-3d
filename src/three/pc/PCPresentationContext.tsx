"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { ViewerMode } from "../core/engineTypes";
import type { PCSlotId } from "./slots";

type PCPresentationState = {
  readonly mode: ViewerMode;
  readonly onInstallationChange: (slotId: PCSlotId, active: boolean) => void;
  readonly reducedMotion: boolean;
};

const defaultPresentation: PCPresentationState = {
  mode: "build",
  onInstallationChange: () => undefined,
  reducedMotion: false,
};

const PCPresentationContext = createContext<PCPresentationState>(defaultPresentation);

type PCPresentationProviderProps = PCPresentationState & {
  readonly children: ReactNode;
};

export function PCPresentationProvider({
  children,
  mode,
  onInstallationChange,
  reducedMotion,
}: PCPresentationProviderProps) {
  return (
    <PCPresentationContext.Provider value={{ mode, onInstallationChange, reducedMotion }}>
      {children}
    </PCPresentationContext.Provider>
  );
}

export const usePCPresentation = (): PCPresentationState => useContext(PCPresentationContext);
