import { NextResponse, type NextRequest } from "next/server";

import {
  createMiddlewareSupabaseClient,
  getMiddlewareUser,
  getMiddlewareWorkspaceStatus
} from "@/server/middleware/session";

const authPaths = new Set([
  "/login",
  "/registro",
  "/recuperar-clave",
  "/actualizar-clave"
]);
const guestOnlyAuthPaths = new Set(["/login", "/registro", "/recuperar-clave"]);
const middlewareTimeoutMs = 2000;

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
  const supabaseContext = createMiddlewareSupabaseClient(request, response);

  if (!supabaseContext) {
    return response;
  }

  const supabase = supabaseContext.client;

  let user;

  try {
    const userResult = await withTimeout(getMiddlewareUser(supabase), "auth.getUser");
    response = supabaseContext.getResponse();

    if (!userResult.ok) {
      return response;
    }

    user = userResult.data;
  } catch {
    return supabaseContext.getResponse();
  }

  const { pathname } = request.nextUrl;
  const isAuthPath = authPaths.has(pathname);
  const isOnboarding = pathname === "/onboarding";

  if (!user && !isAuthPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && guestOnlyAuthPaths.has(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && !isOnboarding && !isAuthPath) {
    let needsOnboarding = false;

    try {
      const workspaceResult = await withTimeout(
        getMiddlewareWorkspaceStatus(supabase, user.id),
        "organizacion_miembros.middleware"
      );

      if (!workspaceResult.ok) {
        return supabaseContext.getResponse();
      }

      needsOnboarding = workspaceResult.data.needsOnboarding;
    } catch {
      return supabaseContext.getResponse();
    }

    if (needsOnboarding) {
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
