"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "./config";
import { createSupabaseFetch } from "./fetch";

export function createBrowserSupabaseClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  return createBrowserClient(config.url, config.anonKey, {
    global: {
      fetch: createSupabaseFetch(),
    },
  });
}
