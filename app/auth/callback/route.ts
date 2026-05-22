import { NextResponse, type NextRequest } from "next/server";

import { getOAuthCallbackRedirectUrl } from "@/lib/auth/oauth";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectUrl = getOAuthCallbackRedirectUrl(request.url);

  if (code) {
    const supabase = createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("oauth", "error");

  return NextResponse.redirect(loginUrl);
}
