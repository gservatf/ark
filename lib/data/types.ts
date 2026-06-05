import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "../supabase/types";

export type {
  AuditContract,
  ChangedFields,
  DataError,
  DataErrorCode,
  DataLoadState,
  DataResult,
  DataScope,
  OptimisticConflictDetails,
  OptimisticMutationOptions,
  VersionedRecord
} from "./contracts";

// Compatibility boundary for the current Supabase implementation. Neutral data
// contracts live in ./contracts so future adapters do not need Supabase types.
export type DataClient = SupabaseClient<Database>;

export type JsonRecord = Record<string, Json>;
