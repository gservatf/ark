import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBrowserConfig } from "./config";
import type { Database } from "./types";

let browserClient: SupabaseClient<Database> | null = null;

function sanitizeHeaderValue(value: string) {
  return value.replace(/[^\x00-\xff]/g, "");
}

function sanitizeHeaders(headers: HeadersInit | undefined) {
  if (!headers) {
    return undefined;
  }

  const sanitized = new Headers();

  if (headers instanceof Headers) {
    headers.forEach((value, key) => sanitized.set(key, sanitizeHeaderValue(value)));
    return sanitized;
  }

  if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => sanitized.set(key, sanitizeHeaderValue(String(value))));
    return sanitized;
  }

  Object.entries(headers).forEach(([key, value]) => {
    sanitized.set(key, sanitizeHeaderValue(String(value)));
  });

  return sanitized;
}

const safeFetch: typeof fetch = (input, init) => {
  const sanitizedInit = init
    ? {
        ...init,
        headers: sanitizeHeaders(init.headers)
      }
    : init;

  return fetch(input, sanitizedInit);
};

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
      fetch: safeFetch,
      headers: {
        "X-Client-Info": "cyp-web"
      }
    }
  });

  return browserClient;
}
