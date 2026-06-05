import { NextResponse, type NextRequest } from "next/server";

import { createMiddlewareSupabaseClient, getMiddlewareUser } from "@/server/middleware/session";

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
      return supabaseContext.getResponse();
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
