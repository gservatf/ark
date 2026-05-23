function cleanPublicEnvValue(value: string | undefined) {
  return value?.replace(/^\uFEFF/, "").trim();
}

export function getSupabaseBrowserConfig() {
  const supabaseUrl = cleanPublicEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey =
    cleanPublicEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    cleanPublicEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return { supabaseKey, supabaseUrl };
}

export function getPublicAppUrl() {
  const configuredUrl = cleanPublicEnvValue(process.env.NEXT_PUBLIC_APP_URL) || "http://127.0.0.1:3000";

  try {
    const url = new URL(configuredUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "http://127.0.0.1:3000";
    }

    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return "http://127.0.0.1:3000";
  }
}

export function buildAppUrl(path = "/") {
  const baseUrl = getPublicAppUrl();
  const safePath = path.startsWith("/") ? path : `/${path}`;

  return new URL(safePath, baseUrl).toString();
}
