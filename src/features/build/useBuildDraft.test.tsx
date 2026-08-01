// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hardwareByCategory, mockHardware } from "@/features/builder/data/mockHardware";
import { buildStorageKey } from "@/features/builder/domain/BuildStorage";
import { BuilderStoreProvider } from "@/features/builder/store/BuilderStoreProvider";
import { createBuilderStore } from "@/store/builderStore";
import { useBuildDraft } from "./useBuildDraft";

function DraftProbe() {
  const draft = useBuildDraft();
  return (
    <div>
      <output aria-label="保存状态">{draft.saveState}</output>
      <output aria-label="配置名称">{draft.buildName}</output>
      <button onClick={() => draft.renameBuild("白色创作工作站")} type="button">
        重命名
      </button>
      <button onClick={() => void draft.saveBuild()} type="button">
        保存
      </button>
    </div>
  );
}

describe("useBuildDraft", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it("tracks store revisions and saves a versioned local BuildConfig", async () => {
    const store = createBuilderStore({ initialCatalogue: mockHardware });
    render(
      <BuilderStoreProvider store={store}>
        <DraftProbe />
      </BuilderStoreProvider>,
    );

    expect(screen.getByLabelText("保存状态").textContent).toBe("clean");

    const amdCpu = hardwareByCategory.cpu[1];
    if (amdCpu !== undefined) {
      act(() => store.getState().selectHardware(amdCpu));
    }
    await waitFor(() => {
      expect(screen.getByLabelText("保存状态").textContent).toBe("dirty");
    });

    fireEvent.click(screen.getByRole("button", { name: "重命名" }));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(screen.getByLabelText("保存状态").textContent).toBe("saved");
    });
    const stored = localStorage.getItem(buildStorageKey);
    expect(stored).not.toBeNull();
    expect(stored).toContain("白色创作工作站");
    expect(stored).toContain("cpu-amd-7800x3d");
  });
});
