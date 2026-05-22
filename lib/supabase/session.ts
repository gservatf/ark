import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

export async function hasActiveWorkspace(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("organizacion_miembros")
    .select("id, organizacion_id, estado")
    .eq("estado", "activo")
    .limit(1)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}
