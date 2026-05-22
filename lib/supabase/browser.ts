import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBrowserConfig } from "./config";
import type { Database } from "./types";

let browserClient: SupabaseClient<Database> | null = null;

export function createBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const { supabaseKey, supabaseUrl } = getSupabaseBrowserConfig();

  browserClient = createSupabaseBrowserClient<Database>(supabaseUrl, supabaseKey);

  return browserClient;
}
