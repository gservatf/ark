import type { ActivityEvent } from "@/types/domain";

import { dataFailure, dataSuccess, normalizeSupabaseError } from "./errors";
import { validateDataScope } from "./scope";
import type { DataClient, DataResult, DataScope } from "./types";

export async function listActivityEvents(
  client: DataClient,
  scope: DataScope,
  limit = 30
): Promise<DataResult<ActivityEvent[]>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const { data, error } = await client
    .from("activity_events")
    .select("*")
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "activity_events.list"));
  }

  return dataSuccess((data || []) as ActivityEvent[]);
}

export const activityRepository = {
  listActivityEvents
};
