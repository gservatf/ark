import { createBrowserClient } from "@/lib/supabase/browser";
import { buildAppUrl, getSupabaseBrowserConfig } from "@/lib/supabase/config";

import type {
  AuthError,
  AuthErrorCode,
  AuthResult,
  AuthUser,
  OAuthSignInInput,
  PasswordResetInput,
  SignInInput,
  SignUpInput,
  SignUpResult,
  UpdatePasswordInput
} from "./contracts";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createBrowserClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    email: user.email ?? null,
    id: user.id
  };
}

export async function signOut() {
  const supabase = createBrowserClient();
  await supabase.auth.signOut();
}

export async function signInWithPassword(input: SignInInput): Promise<AuthResult<AuthUser | null>> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    options: input.captchaToken ? { captchaToken: input.captchaToken } : undefined,
    password: input.password
  });

  if (error) {
    return authFailure(error);
  }

  return authSuccess(normalizeAuthUser(data.user));
}

export async function sendPasswordReset(input: PasswordResetInput): Promise<AuthResult<null>> {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    ...(input.captchaToken ? { captchaToken: input.captchaToken } : {}),
    ...(input.redirectTo ? { redirectTo: input.redirectTo } : {})
  });

  if (error) {
    return authFailure(error);
  }

  return authSuccess(null);
}

export async function updatePassword(input: UpdatePasswordInput): Promise<AuthResult<AuthUser | null>> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.updateUser({ password: input.password });

  if (error) {
    return authFailure(error);
  }

  return authSuccess(normalizeAuthUser(data.user));
}

export async function signInWithOAuth(input: OAuthSignInInput): Promise<AuthResult<null>> {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.signInWithOAuth({
    options: input.redirectTo ? { redirectTo: input.redirectTo } : undefined,
    provider: input.provider
  });

  if (error) {
    return authFailure(error);
  }

  return authSuccess(null);
}

export async function signUpWithEmail(input: SignUpInput): Promise<AuthResult<SignUpResult>> {
  const { supabaseKey, supabaseUrl } = getSupabaseBrowserConfig();
  const redirectTo = input.redirectTo || buildAppUrl("/onboarding");
  const response = await fetch(`${supabaseUrl}/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`, {
    body: JSON.stringify({
      data: {},
      email: input.email,
      gotrue_meta_security: input.captchaToken ? { captcha_token: input.captchaToken } : {},
      password: input.password
    }),
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "X-Client-Info": "cyp-web-signup"
    },
    method: "POST"
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return authFailure(createAuthRestError(payload, response.status));
  }

  return authSuccess({
    hasSession: Boolean(payload?.session)
  });
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

function normalizeAuthUser(user: { email?: string | null; id: string } | null): AuthUser | null {
  if (!user) {
    return null;
  }

  return {
    email: user.email ?? null,
    id: user.id
  };
}

function normalizeAuthError(error: unknown): AuthError {
  const record = error as {
    code?: string;
    message?: string;
    name?: string;
    status?: number;
  };
  const message = record?.message || "No se pudo completar la operacion de autenticacion.";

  return {
    code: getAuthErrorCode(record),
    message
  };
}

function getAuthErrorCode(error: { code?: string; message?: string; name?: string; status?: number }): AuthErrorCode {
  const source = `${error.code || ""} ${error.name || ""} ${error.message || ""}`.toLowerCase();

  if (source.includes("invalid") || source.includes("credentials")) {
    return "invalid_credentials";
  }

  if (source.includes("confirm")) {
    return "email_not_confirmed";
  }

  if (source.includes("password")) {
    return "password_policy";
  }

  if (source.includes("rate") || error.status === 429) {
    return "rate_limited";
  }

  if (source.includes("session") || source.includes("jwt")) {
    return "session_expired";
  }

  return "unknown";
}

function createAuthRestError(payload: { message?: string; msg?: string } | null, status: number) {
  return {
    message: payload?.msg || payload?.message || `Supabase Auth respondio ${status}.`,
    status
  };
}
