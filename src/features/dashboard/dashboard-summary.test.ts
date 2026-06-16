import { describe, expect, it } from "vitest";

import { getDashboardMonthRange, summarizeMonthlyWashLogs } from "./dashboard-summary";

describe("dashboard summary", () => {
  it("creates a Korean-time month range for dashboard queries", () => {
    expect(getDashboardMonthRange(new Date("2026-05-19T12:00:00.000Z"))).toEqual({
      start: "2026-05-01",
      end: "2026-06-01",
    });
  });

  it("counts monthly wash logs and sums their costs", () => {
    expect(
      summarizeMonthlyWashLogs([
        { cost: 15000 },
        { cost: 0 },
        { cost: 32000 },
      ]),
    ).toEqual({
      count: 3,
      totalCost: 47000,
      averageCost: 15667,
    });
  });

  it("returns zero average cost when there are no monthly wash logs", () => {
    expect(summarizeMonthlyWashLogs([])).toEqual({
      count: 0,
      totalCost: 0,
      averageCost: 0,
    });
  });
});
