import { createBrowserClient } from "@/lib/supabase/browser";

import type {
  AuthError,
  AuthErrorCode,
  AuthResult,
  AuthUser,
  OAuthSignInInput,
  PasswordResetInput,
  SignInInput,
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
