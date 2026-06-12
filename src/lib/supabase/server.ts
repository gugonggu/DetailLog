import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "./config";
import { createSupabaseFetch } from "./fetch";

export async function createServerSupabaseClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    global: {
      fetch: createSupabaseFetch(),
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always mutate cookies. Middleware refreshes them.
        }
      },
    },
  });
}
