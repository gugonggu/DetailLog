import { describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";

import {
  createSupabaseFetch,
  SUPABASE_NETWORK_ERROR_MESSAGE,
} from "./fetch";

describe("createSupabaseFetch", () => {
  it("returns successful responses unchanged", async () => {
    const response = new Response("ok", { status: 200 });
    const fetcher = vi.fn().mockResolvedValue(response);

    const result = await createSupabaseFetch(fetcher)("https://example.com");

    expect(result).toBe(response);
  });

  it("converts thrown network failures into a Supabase-compatible error response", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await createSupabaseFetch(fetcher)("https://example.com");

    expect(result.status).toBe(500);
    await expect(result.json()).resolves.toMatchObject({
      code: "SUPABASE_NETWORK_ERROR",
      error: "SUPABASE_NETWORK_ERROR",
      error_description: SUPABASE_NETWORK_ERROR_MESSAGE,
      message: SUPABASE_NETWORK_ERROR_MESSAGE,
      msg: SUPABASE_NETWORK_ERROR_MESSAGE,
    });
  });

  it("makes Supabase Auth return an error instead of a false signup success", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const supabase = createClient("https://example.supabase.co", "anon-key", {
      global: {
        fetch: createSupabaseFetch(fetcher),
      },
    });

    const { data, error } = await supabase.auth.signUp({
      email: "user@example.com",
      password: "password123",
    });

    expect(data.user).toBeNull();
    expect(error?.message).toBe(SUPABASE_NETWORK_ERROR_MESSAGE);
  });
});
