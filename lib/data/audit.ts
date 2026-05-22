import type { Json } from "../supabase/types";

import { dataFailure, dataSuccess, normalizeSupabaseError } from "./errors";
import { validateDataScope } from "./scope";
import type { AuditContract, ChangedFields, DataClient, DataResult } from "./types";

const AUDIT_METADATA_KEYS = new Set(["created_at", "updated_at", "created_by", "updated_by"]);

export function getChangedFields(
  before: object | null | undefined,
  after: object | null | undefined
): ChangedFields {
  const changes: ChangedFields = {};
  const beforeRecord = (before || {}) as Record<string, unknown>;
  const afterRecord = (after || {}) as Record<string, unknown>;
  const keys = new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]);

  keys.forEach((key) => {
    if (AUDIT_METADATA_KEYS.has(key)) {
      return;
    }

    const beforeValue = beforeRecord[key];
    const afterValue = afterRecord[key];

    if (!Object.is(beforeValue, afterValue)) {
      changes[key] = {
        after: afterValue,
        before: beforeValue
      };
    }
  });

  return changes;
}

export async function insertActivityEvent(
  client: DataClient,
  contract: AuditContract
): Promise<DataResult<null>> {
  const scopeResult = validateDataScope(contract.scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const scope = scopeResult.data;
  const { error } = await client.from("activity_events").insert({
    action: contract.action,
    actor_id: scope.actorId,
    after: toJson(contract.after),
    before: toJson(contract.before),
    changed_fields: toJson(contract.changedFields),
    entity_id: contract.entityId || null,
    entity_type: contract.entityType,
    metadata: toJson(contract.metadata || {}),
    organizacion_id: scope.organizacionId,
    presupuesto_borrador_id: contract.presupuestoBorradorId || null,
    presupuesto_version_id: contract.presupuestoVersionId || null,
    proyecto_id: scope.proyectoId || null
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "activity_events.insert"));
  }

  return dataSuccess(null);
}

function toJson(value: unknown): Json | null {
  if (value === undefined) {
    return null;
  }

  return value as Json;
}
