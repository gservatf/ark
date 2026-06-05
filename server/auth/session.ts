import { createServerClient } from "@/lib/supabase/server";

import type { AuthError, AuthErrorCode, AuthResult, AuthUser } from "@/lib/auth/contracts";

export type ServerAuthSession = {
  expiresAt: number | null;
  isAuthenticated: boolean;
  user: AuthUser | null;
};

export async function getServerUser(): Promise<AuthResult<AuthUser | null>> {
  const supabase = createServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    return authFailure(error);
  }

  return authSuccess(normalizeAuthUser(user));
}

export async function getServerSession(): Promise<AuthResult<ServerAuthSession>> {
  const userResult = await getServerUser();

  if (!userResult.ok) {
    return userResult;
  }

  if (!userResult.data) {
    return authSuccess({
      expiresAt: null,
      isAuthenticated: false,
      user: null
    });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return authFailure(error);
  }

  return authSuccess({
    expiresAt: data.session?.expires_at ?? null,
    isAuthenticated: true,
    user: userResult.data
  });
}

export async function requireServerUser(): Promise<AuthResult<AuthUser>> {
  const userResult = await getServerUser();

  if (!userResult.ok) {
    return userResult;
  }

  if (!userResult.data) {
    return authFailure({
      code: "session_expired",
      message: "La sesion no esta activa."
    });
  }

  return authSuccess(userResult.data);
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

  return {
    code: getAuthErrorCode(record),
    message: record?.message || "No se pudo consultar la sesion del usuario."
  };
}

function getAuthErrorCode(error: { code?: string; message?: string; name?: string; status?: number }): AuthErrorCode {
  const source = `${error.code || ""} ${error.name || ""} ${error.message || ""}`.toLowerCase();

  if (source.includes("confirm")) {
    return "email_not_confirmed";
  }

  if (source.includes("rate") || error.status === 429) {
    return "rate_limited";
  }

  if (source.includes("session") || source.includes("jwt") || source.includes("auth")) {
    return "session_expired";
  }

  return "unknown";
}
