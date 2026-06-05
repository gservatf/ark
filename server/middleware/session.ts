import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuthError, AuthErrorCode, AuthResult, AuthUser } from "@/lib/auth/contracts";
import { dataSuccess } from "@/lib/data/errors";
import type { DataResult } from "@/lib/data/types";
import type { Database } from "@/lib/supabase/types";
import {
  hasVisibleActiveWorkspaceWithClient,
  type WorkspaceOnboardingStatus
} from "@/server/workspace/onboarding";

export type MiddlewareSupabaseClient = SupabaseClient<Database>;

export type MiddlewareSupabaseContext = {
  client: MiddlewareSupabaseClient;
  getResponse: () => NextResponse;
};

export function createMiddlewareSupabaseClient(
  request: NextRequest,
  response: NextResponse
): MiddlewareSupabaseContext | null {
  let currentResponse = response;
  const config = getMiddlewareSupabaseConfig();

  if (!config) {
    return null;
  }

  const client = createSupabaseServerClient<Database>(config.supabaseUrl, config.supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options) {
        request.cookies.set({ ...options, name, value });
        currentResponse = NextResponse.next({ request });
        currentResponse.cookies.set({ ...options, name, value });
      },
      remove(name: string, options) {
        request.cookies.set({ ...options, name, value: "" });
        currentResponse = NextResponse.next({ request });
        currentResponse.cookies.set({ ...options, name, value: "" });
      }
    }
  });

  return {
    client,
    getResponse: () => currentResponse
  };
}

function getMiddlewareSupabaseConfig() {
  const supabaseUrl = cleanPublicEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey =
    cleanPublicEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    cleanPublicEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return supabaseUrl && supabaseKey ? { supabaseKey, supabaseUrl } : null;
}

function cleanPublicEnvValue(value: string | undefined) {
  return value?.replace(/^\uFEFF/, "").trim();
}

export async function getMiddlewareUser(client: MiddlewareSupabaseClient): Promise<AuthResult<AuthUser | null>> {
  const {
    data: { user },
    error
  } = await client.auth.getUser();

  if (error) {
    return authFailure(error);
  }

  return authSuccess(normalizeAuthUser(user));
}

export async function getMiddlewareWorkspaceStatus(
  client: MiddlewareSupabaseClient,
  userId: string
): Promise<DataResult<WorkspaceOnboardingStatus>> {
  const workspaceResult = await hasVisibleActiveWorkspaceWithClient(client, userId);

  if (!workspaceResult.ok) {
    return workspaceResult;
  }

  return dataSuccess({
    needsOnboarding: !workspaceResult.data.hasActiveWorkspace,
    workspace: workspaceResult.data
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

  return {
    code: getAuthErrorCode(record),
    message: record?.message || "No se pudo consultar la sesion del middleware."
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
