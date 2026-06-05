import { createBrowserClient } from "@/lib/supabase/browser";

import type { AuthUser } from "./contracts";

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
