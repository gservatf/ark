import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBrowserConfig } from "./config";
import type { Database } from "./types";

let browserClient: SupabaseClient<Database> | null = null;

export function createBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const { supabaseKey, supabaseUrl } = getSupabaseBrowserConfig();

  browserClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true
    },
    global: {
      headers: {
        "X-Client-Info": "cyp-web"
      }
    }
  });

  return browserClient;
}
