// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HardwareExplorer } from "./HardwareExplorer";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/builder/api/HardwareApiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/builder/api/HardwareApiClient")>();
  return {
    ...actual,
    fetchHardwarePage: vi.fn().mockResolvedValue({
      page: 1,
      size: 24,
      total: 0,
      pages: 0,
      items: [],
    }),
  };
});

describe("HardwareExplorer responsive filters", () => {
  afterEach(() => {
    cleanup();
    push.mockClear();
  });

  it("keeps category filtering available in the compact filter panel", () => {
    render(<HardwareExplorer />);

    const category = screen.getByRole("combobox", { name: "组件分类" });
    fireEvent.change(category, { target: { value: "GPU" } });

    expect(push).toHaveBeenCalledWith("/hardware?category=GPU");
  });
});
