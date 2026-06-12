import { describe, expect, it } from "vitest";

import { parseCommunityFilters } from "./community-filters";

describe("community filters", () => {
  it("parses supported filters with latest order", () => {
    expect(
      parseCommunityFilters({
        keyword: "  glossy finish  ",
        dirtLevel: "2",
        satisfaction: "4",
        order: "latest",
      }),
    ).toEqual({
      keyword: "glossy finish",
      dirtLevel: 2,
      satisfaction: 4,
      order: "latest",
      hasActiveFilters: true,
    });
  });

  it("drops unsupported values without marking default order active", () => {
    expect(
      parseCommunityFilters({
        dirtLevel: "0",
        satisfaction: "6",
        order: "popular",
      }),
    ).toEqual({
      keyword: "",
      dirtLevel: null,
      satisfaction: null,
      order: "latest",
      hasActiveFilters: false,
    });
  });
});
