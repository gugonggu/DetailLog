import { describe, expect, it } from "vitest";
import { z } from "zod";

import { getRoutineFallbackReason } from "@/features/routines/fallback-reason";
import {
  ROUTINE_DAILY_LIMIT,
  getRoutineDailyRange,
  hasReachedRoutineDailyLimit,
} from "@/features/routines/routine-rate-limit";

describe("routine API fallback reasons", () => {
  it("explains OpenAI request failures", () => {
    expect(
      getRoutineFallbackReason(new Error("OpenAI request failed with status 400.")),
    ).toBe("OpenAI request failed with status 400.");
  });

  it("summarizes routine result validation failures", () => {
    const error = new z.ZodError([
      {
        code: "too_big",
        maximum: 12,
        type: "array",
        inclusive: true,
        exact: false,
        message: "Array must contain at most 12 element(s)",
        path: ["steps", 0, "products"],
      },
    ]);

    expect(getRoutineFallbackReason(error)).toBe(
      "AI response validation failed: steps.0.products: Array must contain at most 12 element(s)",
    );
  });

  it("explains invalid JSON responses", () => {
    expect(getRoutineFallbackReason(new SyntaxError("Unexpected end of JSON input"))).toBe(
      "AI response was not valid JSON: Unexpected end of JSON input",
    );
  });
});

describe("routine API rate limits", () => {
  it("uses a UTC daily range for quota checks", () => {
    expect(getRoutineDailyRange(new Date("2026-06-16T15:30:00.000Z"))).toEqual({
      start: "2026-06-16T00:00:00.000Z",
      end: "2026-06-17T00:00:00.000Z",
    });
  });

  it("blocks requests at the daily limit", () => {
    expect(hasReachedRoutineDailyLimit(ROUTINE_DAILY_LIMIT - 1)).toBe(false);
    expect(hasReachedRoutineDailyLimit(ROUTINE_DAILY_LIMIT)).toBe(true);
  });
});
