import { describe, expect, it } from "vitest";

import {
  createWashLogKeywordFilter,
  parseWashLogFilters,
} from "./wash-log-filters";

describe("wash log filters", () => {
  it("parses supported filters and reports active filters", () => {
    expect(
      parseWashLogFilters({
        keyword: "  weekend wash  ",
        car: "car-id",
        visibility: "public",
        dirtLevel: "3",
        satisfaction: "5",
        from: "2026-05-01",
        to: "2026-05-31",
      }),
    ).toEqual({
      keyword: "weekend wash",
      car: "car-id",
      visibility: "public",
      dirtLevel: 3,
      satisfaction: 5,
      from: "2026-05-01",
      to: "2026-05-31",
      hasActiveFilters: true,
    });
  });

  it("drops unsupported values and uses the first array value", () => {
    expect(
      parseWashLogFilters({
        keyword: [" first ", "second"],
        visibility: "friends",
        dirtLevel: "6",
        satisfaction: "zero",
        from: "05-01-2026",
        to: "2026-02-31",
      }),
    ).toEqual({
      keyword: "first",
      car: "",
      visibility: "",
      dirtLevel: null,
      satisfaction: null,
      from: "",
      to: "",
      hasActiveFilters: true,
    });
  });

  it("creates a safe basic keyword filter for searchable text columns", () => {
    expect(createWashLogKeywordFilter(" glossy, (finish)% ")).toBe(
      "title.ilike.%glossy finish%,location.ilike.%glossy finish%,memo.ilike.%glossy finish%",
    );
  });
});
