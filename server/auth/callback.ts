import { getOAuthCallbackRedirectUrl } from "@/lib/auth/oauth";
import type { AuthError, AuthErrorCode, AuthResult } from "@/lib/auth/contracts";
import { createServerClient } from "@/lib/supabase/server";

export async function exchangeOAuthCodeForSession(code: string): Promise<AuthResult<null>> {
  if (!code) {
    return authFailure({
      code: "provider_error",
      message: "No se recibio el codigo OAuth."
    });
  }

  const supabase = createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return authFailure(error);
  }

  return authSuccess(null);
}

export function getOAuthSuccessRedirect(requestUrl: string) {
  return getOAuthCallbackRedirectUrl(requestUrl);
}

export function getOAuthErrorRedirect(requestUrl: string) {
  const loginUrl = new URL("/login", requestUrl);
  loginUrl.searchParams.set("oauth", "error");

  return loginUrl;
}

function authSuccess<T>(data: T): AuthResult<T> {
  return { data, ok: true };
}

function authFailure(error: unknown): AuthResult<never> {
  return {
    error: normalizeAuthError(error),
    ok: false
  };
}

function normalizeAuthError(error: unknown): AuthError {
  const record = error as {
    code?: string;
    message?: string;
    name?: string;
    status?: number;
  };

  return {
    code: getAuthErrorCode(record),
    message: record?.message || "No se pudo completar el callback OAuth."
  };
}

function getAuthErrorCode(error: { code?: string; message?: string; name?: string; status?: number }): AuthErrorCode {
  const source = `${error.code || ""} ${error.name || ""} ${error.message || ""}`.toLowerCase();

  if (source.includes("provider") || source.includes("oauth")) {
    return "provider_error";
  }

  if (source.includes("rate") || error.status === 429) {
    return "rate_limited";
  }

  if (source.includes("session") || source.includes("jwt") || source.includes("auth")) {
    return "session_expired";
  }

  return "unknown";
}
