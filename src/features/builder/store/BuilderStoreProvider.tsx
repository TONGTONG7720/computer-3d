"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import { type BuilderStore, createBuilderStore } from "@/store/builderStore";
import { MissingBuilderStoreProviderError } from "./BuilderStoreErrors";

const BuilderStoreContext = createContext<StoreApi<BuilderStore> | null>(null);

type BuilderStoreProviderProps = {
  readonly children: ReactNode;
  readonly store?: StoreApi<BuilderStore>;
};

export function BuilderStoreProvider({ children, store }: BuilderStoreProviderProps) {
  const [workspaceStore] = useState(() => store ?? createBuilderStore());

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
