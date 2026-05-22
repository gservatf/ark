import { dataFailure } from "./errors";
import type {
  ChangedFields,
  DataClient,
  DataError,
  DataResult,
  OptimisticConflictDetails,
  OptimisticMutationOptions,
  VersionedRecord
} from "./types";
import { getChangedFields } from "./audit";

type ConflictSource = {
  entityLabel: string;
  source: string;
};

export function getExpectedUpdatedAt<T extends VersionedRecord>(
  record: T | null | undefined,
  options?: OptimisticMutationOptions
) {
  return options?.expectedUpdatedAt || record?.updated_at || "";
}

export function isOptimisticConflict(error: DataError): error is DataError & {
  details: OptimisticConflictDetails;
} {
  return error.code === "conflict" && isConflictDetails(error.details);
}

export function getConflictFieldLabels(error: DataError) {
  if (!isOptimisticConflict(error)) {
    return [];
  }

  return Object.keys(error.details.changedFields);
}

export function optimisticConflictError<TPersisted extends VersionedRecord, TLocal = unknown>({
  attempted,
  base,
  entityLabel,
  expectedUpdatedAt,
  persisted,
  source
}: ConflictSource & {
  attempted?: TLocal;
  base?: unknown;
  expectedUpdatedAt: string;
  persisted: TPersisted;
}): DataError {
  const details: OptimisticConflictDetails<TPersisted, TLocal> = {
    attempted,
    base,
    changedFields: getChangedFields(base ?? null, persisted) as ChangedFields,
    entityId: persisted.id,
    expectedUpdatedAt,
    persisted
  };

  return {
    code: "conflict",
    details,
    message: `${entityLabel} cambio mientras estabas editando. Revisa los cambios antes de sobrescribir.`,
    source
  };
}

export async function conflictFailureFromLatest<TPersisted extends VersionedRecord, TLocal = unknown>(
  client: DataClient,
  table: string,
  id: string,
  expectedUpdatedAt: string,
  config: ConflictSource & {
    attempted?: TLocal;
    base?: unknown;
    select?: string;
  }
): Promise<DataResult<never>> {
  const { data, error } = await client
    .from(table as never)
    .select(config.select || "*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return dataFailure({
      code: "conflict",
      details: error || { id },
      message: `${config.entityLabel} cambio o ya no esta disponible. Recarga antes de guardar.`,
      source: config.source
    });
  }

  return dataFailure(
    optimisticConflictError({
      attempted: config.attempted,
      base: config.base,
      entityLabel: config.entityLabel,
      expectedUpdatedAt,
      persisted: data as TPersisted,
      source: config.source
    })
  );
}

function isConflictDetails(value: unknown): value is OptimisticConflictDetails {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.entityId === "string" &&
    typeof record.expectedUpdatedAt === "string" &&
    Boolean(record.persisted) &&
    Boolean(record.changedFields)
  );
}
