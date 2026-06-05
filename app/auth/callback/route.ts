import { NextResponse, type NextRequest } from "next/server";

import {
  exchangeOAuthCodeForSession,
  getOAuthErrorRedirect,
  getOAuthSuccessRedirect
} from "@/server/auth/callback";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectUrl = getOAuthSuccessRedirect(request.url);

  if (code) {
    const exchangeResult = await exchangeOAuthCodeForSession(code);

    if (exchangeResult.ok) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(getOAuthErrorRedirect(request.url));
}
