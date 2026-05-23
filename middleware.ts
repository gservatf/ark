import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/supabase/types";

const authPaths = new Set([
  "/login",
  "/registro",
  "/recuperar-clave",
  "/actualizar-clave"
]);
const middlewareTimeoutMs = 2000;

function cleanPublicEnvValue(value: string | undefined) {
  return value?.replace(/^\uFEFF/, "").trim();
}

function withTimeout<T>(promise: PromiseLike<T>, label: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timeout`)), middlewareTimeoutMs);
    })
  ]);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = cleanPublicEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey =
    cleanPublicEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    cleanPublicEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options) {
        request.cookies.set({ ...options, name, value });
        response = NextResponse.next({ request });
        response.cookies.set({ ...options, name, value });
      },
      remove(name: string, options) {
        request.cookies.set({ ...options, name, value: "" });
        response = NextResponse.next({ request });
        response.cookies.set({ ...options, name, value: "" });
      }
    }
  });

  let user;

  try {
    const userResult = await withTimeout(supabase.auth.getUser(), "auth.getUser");
    user = userResult.data.user;
  } catch {
    return response;
  }

  const { pathname } = request.nextUrl;
  const isAuthPath = authPaths.has(pathname);
  const isOnboarding = pathname === "/onboarding";

  if (!user && !isAuthPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && !isOnboarding && !isAuthPath) {
    let data;

    try {
      const membershipResult = await withTimeout(
        supabase
          .from("organizacion_miembros")
          .select("id")
          .eq("estado", "activo")
          .limit(1)
          .maybeSingle(),
        "organizacion_miembros.middleware"
      );
      data = membershipResult.data;
    } catch {
      return response;
    }

    if (!data) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/registro",
    "/recuperar-clave",
    "/actualizar-clave",
    "/onboarding",
    "/cronogramas/:path*",
    "/partidas/:path*",
    "/presupuestos/:path*",
    "/proveedores/:path*",
    "/recursos/:path*",
    "/reportes/:path*",
    "/configuracion/:path*"
  ]
};
