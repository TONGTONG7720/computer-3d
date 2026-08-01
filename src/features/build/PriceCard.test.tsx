// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PriceCard } from "./PriceCard";

describe("PriceCard", () => {
  afterEach(() => cleanup());

  it("shows authoritative internal-price provenance and over-budget feedback", () => {
    render(
      <PriceCard
        analysisStatus="ready"
        budgetReport={{
          status: "OVER",
          limit: 10000,
          current: 12000,
          remaining: 0,
          overage: 2000,
          utilizationPercent: 120,
        }}
        powerUsage={720}
        priceDelta={500}
        priceSource="PC_LAB_INTERNAL_REFERENCE"
        totalPrice={12000}
      />,
    );

    expect(screen.getByText("超出预算 ¥2,000")).toBeTruthy();
    expect(screen.getByText(/PC LAB 内部参考价/)).toBeTruthy();
    expect(screen.getByText(/非实时商城报价/)).toBeTruthy();
  });
});
