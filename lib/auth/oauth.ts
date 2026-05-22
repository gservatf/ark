import { sanitizeNextPath } from "./security";
import { buildAppUrl } from "../supabase/config";

const oauthCallbackPath = "/auth/callback";

export function buildOAuthRedirectTo(nextPath: string | null | undefined) {
  const params = new URLSearchParams({
    next: sanitizeNextPath(nextPath)
  });

  return buildAppUrl(`${oauthCallbackPath}?${params.toString()}`);
}

export function getOAuthCallbackRedirectUrl(requestUrl: string) {
  const url = new URL(requestUrl);
  const safeNext = sanitizeNextPath(url.searchParams.get("next"));

  return new URL(safeNext, url.origin);
}
