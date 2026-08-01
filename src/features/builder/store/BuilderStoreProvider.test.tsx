// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { hardwareByCategory, mockHardware } from "@/features/builder/data/mockHardware";
import { hardwareCategories } from "@/features/builder/domain/hardware";
import { createBuilderStore } from "@/store/builderStore";
import { BuilderStoreProvider, useBuilderWorkspaceStore } from "./BuilderStoreProvider";

function StoreProbe() {
  const selectedComponents = useBuilderWorkspaceStore((state) => state.selectedComponents);
  const totalPrice = useBuilderWorkspaceStore((state) => state.totalPrice);
  const compatibility = useBuilderWorkspaceStore((state) => state.compatibilityStatus.status);
  const selectHardware = useBuilderWorkspaceStore((state) => state.selectHardware);
  const installedCount = hardwareCategories.filter(
    (category) => selectedComponents[category] !== null,
  ).length;
  const amdCpu = hardwareByCategory.cpu[1];

  return (
    <div>
      <output aria-label="已安装组件数">{installedCount}</output>
      <output aria-label="整机价格">{totalPrice}</output>
      <output aria-label="兼容状态">{compatibility}</output>
      <button
        disabled={amdCpu === undefined}
        onClick={() => {
          if (amdCpu !== undefined) {
            selectHardware(amdCpu);
          }
        }}
        type="button"
      >
        选择 AMD CPU
      </button>
    </div>
  );
}

function CatalogueProbe() {
  const catalogue = useBuilderWorkspaceStore((state) => state.catalogue);
  const status = useBuilderWorkspaceStore((state) => state.catalogueStatus);
  return <output aria-label="目录状态">{`${status}:${catalogue.length}`}</output>;
}

describe("BuilderStoreProvider", () => {
  afterEach(() => cleanup());

  it("starts with a complete local fixture build and recalculates one shared revision", () => {
    const store = createBuilderStore({ initialCatalogue: mockHardware });
    const initialPrice = store.getState().totalPrice;

    render(
      <BuilderStoreProvider store={store}>
        <StoreProbe />
      </BuilderStoreProvider>,
    );

    expect(screen.getByLabelText("已安装组件数").textContent).toBe("8");
    expect(screen.getByLabelText("兼容状态").textContent).toBe("success");

    fireEvent.click(screen.getByRole("button", { name: "选择 AMD CPU" }));

    expect(Number(screen.getByLabelText("整机价格").textContent)).not.toBe(initialPrice);
    expect(screen.getByLabelText("兼容状态").textContent).toBe("error");
    expect(store.getState().feedback.revision).toBe(1);
  });

  it("does not inject mock hardware into the runtime provider", () => {
    render(
      <BuilderStoreProvider>
        <CatalogueProbe />
      </BuilderStoreProvider>,
    );

    expect(screen.getByLabelText("目录状态").textContent).toBe("idle:0");
  });
});
