// @vitest-environment jsdom

import { afterEach, expect, it, vi } from "vitest";
import { parsePriceAlertOwner } from "../api/PriceApiClient";
import { getOrCreatePriceAlertOwner } from "./priceAlertOwner";

const ownerValue = "7f34d22c-7be0-49e0-bf66-fdf116188756";
const owner = parsePriceAlertOwner(ownerValue);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

it("returns one stable browser UUID", () => {
  vi.stubGlobal("crypto", { randomUUID: vi.fn(() => ownerValue) });

  const first = getOrCreatePriceAlertOwner();
  const second = getOrCreatePriceAlertOwner();

  expect(first).toBe(owner);
  expect(second).toBe(owner);
  expect(window.localStorage.getItem("pc-lab-price-alert-owner-v1")).toBe(owner);
});

it("fails safely when browser storage or UUID generation is unavailable", () => {
  const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("storage unavailable");
  });
  expect(getOrCreatePriceAlertOwner()).toBeNull();
  getItem.mockRestore();

  vi.stubGlobal("crypto", {
    randomUUID: vi.fn(() => {
      throw new DOMException("crypto unavailable");
    }),
  });
  expect(getOrCreatePriceAlertOwner()).toBeNull();
});
