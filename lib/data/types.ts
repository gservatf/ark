import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "../supabase/types";

export type DataClient = SupabaseClient<Database>;

export interface DataScope {
  actorId?: string;
  organizacionId: string;
  proyectoId?: string;
}

export type DataErrorCode =
  | "validation"
  | "not_found"
  | "permission"
  | "conflict"
  | "supabase"
  | "unknown";

export interface DataError {
  code: DataErrorCode;
  details?: unknown;
  message: string;
  source?: string;
}

export interface VersionedRecord {
  id: string;
  updated_at?: string;
}

export interface OptimisticConflictDetails<TPersisted = unknown, TLocal = unknown> {
  attempted?: TLocal;
  base?: unknown;
  changedFields: ChangedFields;
  entityId: string;
  expectedUpdatedAt: string;
  persisted: TPersisted;
}

export interface OptimisticMutationOptions<TBase = unknown, TLocal = unknown> {
  attempted?: TLocal;
  base?: TBase;
  expectedUpdatedAt?: string;
}

export type DataResult<T> =
  | { data: T; ok: true }
  | { error: DataError; ok: false };

export type DataLoadState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { data: T; status: "success" }
  | { error: DataError; status: "error" };

export interface AuditContract {
  action: string;
  after?: unknown;
  before?: unknown;
  changedFields?: unknown;
  entityId?: string | null;
  entityType: string;
  metadata?: Record<string, unknown>;
  presupuestoBorradorId?: string | null;
  presupuestoVersionId?: string | null;
  scope: DataScope;
}

export type ChangedFields = Record<
  string,
  {
    after: unknown;
    before: unknown;
  }
>;

export type JsonRecord = Record<string, Json>;
