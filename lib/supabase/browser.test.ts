import { beforeEach, describe, expect, it, vi } from "vitest";

describe("createBrowserClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("reutiliza una unica instancia del cliente Supabase en el modulo", async () => {
    const supabaseClient = { auth: {} };
    const createSupabaseClient = vi.fn(() => supabaseClient);
    const getSupabaseBrowserConfig = vi.fn(() => ({
      supabaseKey: "anon-key",
      supabaseUrl: "http://127.0.0.1:54321"
    }));

    vi.doMock("@supabase/supabase-js", () => ({
      createClient: createSupabaseClient
    }));
    vi.doMock("./config", () => ({
      getSupabaseBrowserConfig
    }));

    const { createBrowserClient } = await import("./browser");

    const firstClient = createBrowserClient();
    const secondClient = createBrowserClient();

    expect(firstClient).toBe(secondClient);
    expect(firstClient).toBe(supabaseClient);
    expect(createSupabaseClient).toHaveBeenCalledTimes(1);
    expect(createSupabaseClient).toHaveBeenCalledWith(
      "http://127.0.0.1:54321",
      "anon-key",
      {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true
        },
        global: {
          fetch: expect.any(Function),
          headers: {
            "X-Client-Info": "cyp-web"
          }
        }
      }
    );
    expect(getSupabaseBrowserConfig).toHaveBeenCalledTimes(1);
  });
});
