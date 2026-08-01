"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import { mockHardware } from "@/features/builder/data/mockHardware";
import { type BuilderStore, createBuilderStore } from "@/store/builderStore";

const BuilderStoreContext = createContext<StoreApi<BuilderStore> | null>(null);

type BuilderStoreProviderProps = {
  readonly children: ReactNode;
  readonly store?: StoreApi<BuilderStore>;
};

export class MissingBuilderStoreProviderError extends Error {
  constructor() {
    super("Builder workspace components require BuilderStoreProvider");
    this.name = "MissingBuilderStoreProviderError";
  }
}

export function BuilderStoreProvider({ children, store }: BuilderStoreProviderProps) {
  const [workspaceStore] = useState(
    () => store ?? createBuilderStore({ initialCatalogue: mockHardware }),
  );

  return (
    <BuilderStoreContext.Provider value={workspaceStore}>{children}</BuilderStoreContext.Provider>
  );
}

export function useBuilderWorkspaceStore<Selection>(
  selector: (state: BuilderStore) => Selection,
): Selection {
  const store = useContext(BuilderStoreContext);
  if (store === null) {
    throw new MissingBuilderStoreProviderError();
  }
  return useStore(store, selector);
}
