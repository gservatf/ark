import { describe, expect, it, vi } from "vitest";

import { bindRealtimeAuth } from "./auth";

describe("realtime auth helpers", () => {
  it("setea el token inicial y renueva realtime auth en TOKEN_REFRESHED", async () => {
    let authCallback: ((event: string, session: { access_token?: string | null } | null) => void) | undefined;
    const unsubscribe = vi.fn();
    const setAuth = vi.fn();
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: "initial-token"
            }
          }
        }),
        onAuthStateChange: vi.fn((callback) => {
          authCallback = callback;

          return {
            data: {
              subscription: {
                unsubscribe
              }
            }
          };
        })
      },
      realtime: {
        setAuth
      }
    };

    const cleanup = bindRealtimeAuth(client);
    await Promise.resolve();

    expect(setAuth).toHaveBeenCalledWith("initial-token");

    authCallback?.("TOKEN_REFRESHED", { access_token: "fresh-token" });
    expect(setAuth).toHaveBeenCalledWith("fresh-token");

    cleanup();
    authCallback?.("TOKEN_REFRESHED", { access_token: "ignored-token" });

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(setAuth).not.toHaveBeenCalledWith("ignored-token");
  });
});
