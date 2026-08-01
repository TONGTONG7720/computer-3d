import { describe, expect, it } from "vitest";
import {
  mergeHardwareSearchDraft,
  readHardwareSearch,
  writeHardwareSearch,
} from "./explorerSearch";

describe("hardware explorer URL state", () => {
  it("restores a shareable technical query", () => {
    const filters = readHardwareSearch(
      new URLSearchParams(
        "q=RTX+5090&category=GPU&brand=NVIDIA&minPrice=5000&maxPrice=16000&minPerformance=90&maxPower=600&page=3&sort=performance_desc",
      ),
    );

    expect(filters).toMatchObject({
      keyword: "RTX 5090",
      category: "GPU",
      brands: ["NVIDIA"],
      minPrice: 5000,
      maxPrice: 16000,
      minPerformance: 90,
      maxPower: 600,
      page: 3,
      sort: "performance_desc",
    });
  });

  it("drops invalid URL values and omits default noise", () => {
    const filters = readHardwareSearch(
      new URLSearchParams("category=PHONE&minPrice=-1&page=0&sort=random"),
    );
    const written = writeHardwareSearch(filters);

    expect(filters.category).toBeUndefined();
    expect(filters.minPrice).toBeUndefined();
    expect(filters.page).toBe(1);
    expect(filters.sort).toBe("relevance");
    expect(written.toString()).toBe("");
  });

  it("preserves an unsent keyword when another control updates the URL", () => {
    const filters = readHardwareSearch(new URLSearchParams("category=GPU&brand=NVIDIA"));
    const merged = mergeHardwareSearchDraft(filters, {
      keyword: "RTX 5080",
      brand: "NVIDIA",
      minPrice: "",
      maxPrice: "",
      minPerformance: "",
      maxPower: "",
    });

    expect(writeHardwareSearch({ ...merged, sort: "performance_desc", page: 1 }).toString()).toBe(
      "q=RTX+5080&category=GPU&brand=NVIDIA&sort=performance_desc",
    );
  });
});
