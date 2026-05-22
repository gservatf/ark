import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseBrowserConfig } from "./config";
import type { Database } from "./types";

export function createServerClient() {
  const cookieStore = cookies();
  const { supabaseKey, supabaseUrl } = getSupabaseBrowserConfig();

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        cookieStore.set({ ...options, name, value });
      },
      remove(name: string, options) {
        cookieStore.set({ ...options, name, value: "" });
      }
    }
  });
}
