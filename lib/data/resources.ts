import { recursoInputSchema, type RecursoInput } from "../validations/resources";
import type { Recurso, RecursoPrecioHistorial } from "../../types/domain";

import { getChangedFields, insertActivityEvent } from "./audit";
import { conflictFailureFromLatest, getExpectedUpdatedAt } from "./conflicts";
import { refreshDraftCurrentPricesForResources } from "./budgets";
import {
  dataFailure,
  dataSuccess,
  normalizeSupabaseError,
  normalizeValidationError,
  notFoundError
} from "./errors";
import { validateDataScope } from "./scope";
import type { DataClient, DataResult, DataScope, OptimisticMutationOptions } from "./types";

export type ResourceUpdateInput = Partial<RecursoInput>;

export type DraftPriceAutoUpdateCandidate = {
  autoactualizar_precio: boolean;
  precio_fijado: boolean;
  precio_origen?: "catalogo" | "manual" | "snapshot" | null;
  recurso_id?: string | null;
};

export type ResourceCatalogPriceChange = {
  costoTransporteAnterior: number;
  costoTransporteNuevo: number;
  costoUnitarioAnterior: number;
  costoUnitarioNuevo: number;
  fechaPrecio: string | null;
  fuentePrecio: string | null;
  recursoId: string;
};

export function createResourceCatalogPriceChange(
  before: Recurso,
  after: Recurso
): ResourceCatalogPriceChange | null {
  const costChanged =
    before.costo_unitario_actual !== after.costo_unitario_actual ||
    before.costo_transporte !== after.costo_transporte;

  if (!costChanged) {
    return null;
  }

  return {
    costoTransporteAnterior: before.costo_transporte,
    costoTransporteNuevo: after.costo_transporte,
    costoUnitarioAnterior: before.costo_unitario_actual,
    costoUnitarioNuevo: after.costo_unitario_actual,
    fechaPrecio: after.fecha_actualizacion_precio || null,
    fuentePrecio: after.fuente_precio || null,
    recursoId: after.id
  };
}

export function canAutoUpdateDraftResourcePrice(
  line: DraftPriceAutoUpdateCandidate,
  priceChange: ResourceCatalogPriceChange
) {
  return (
    line.recurso_id === priceChange.recursoId &&
    line.autoactualizar_precio &&
    !line.precio_fijado &&
    (line.precio_origen ?? "catalogo") === "catalogo"
  );
}

export async function listResources(
  client: DataClient,
  scope: DataScope
): Promise<DataResult<Recurso[]>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const { data, error } = await client
    .from("recursos")
    .select("*")
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .order("nombre", { ascending: true });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "recursos.list"));
  }

  return dataSuccess(data || []);
}

export async function getResourceById(
  client: DataClient,
  scope: DataScope,
  resourceId: string
): Promise<DataResult<Recurso>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  if (!resourceId.trim()) {
    return dataFailure(notFoundError());
  }

  const { data, error } = await client
    .from("recursos")
    .select("*")
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("id", resourceId)
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "recursos.getById"));
  }

  if (!data) {
    return dataFailure(notFoundError());
  }

  return dataSuccess(data);
}

export async function createResource(
  client: DataClient,
  scope: DataScope,
  input: RecursoInput
): Promise<DataResult<Recurso>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const parsed = recursoInputSchema.safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const { data, error } = await client
    .from("recursos")
    .insert({
      ...normalizeResourceInput(parsed.data),
      organizacion_id: scopeResult.data.organizacionId
    })
    .select("*")
    .single();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "recursos.create"));
  }

  const auditResult = await insertActivityEvent(client, {
    action: "create",
    after: data,
    before: null,
    changedFields: getChangedFields(null, data),
    entityId: data.id,
    entityType: "recurso",
    metadata: { repository: "resourcesRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data);
}

export async function updateResource(
  client: DataClient,
  scope: DataScope,
  resourceId: string,
  input: ResourceUpdateInput,
  options: OptimisticMutationOptions<Recurso, ResourceUpdateInput> = {}
): Promise<DataResult<Recurso>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const parsed = recursoInputSchema.partial().safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const currentResult = await getResourceById(client, scopeResult.data, resourceId);

  if (!currentResult.ok) {
    return currentResult;
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(currentResult.data, options);
  const updateData = normalizeResourceInput(parsed.data);
  const { data, error } = await client
    .from("recursos")
    .update(updateData)
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("id", resourceId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "recursos.update"));
  }

  if (!data) {
    return conflictFailureFromLatest<Recurso, ResourceUpdateInput>(client, "recursos", resourceId, expectedUpdatedAt, {
      attempted: options.attempted || updateData,
      base: options.base || currentResult.data,
      entityLabel: "El recurso",
      source: "recursos.update"
    });
  }

  const priceHistoryResult = await insertPriceHistoryIfNeeded(
    client,
    scopeResult.data,
    currentResult.data,
    data
  );

  if (!priceHistoryResult.ok) {
    return priceHistoryResult;
  }

  if (createResourceCatalogPriceChange(currentResult.data, data)) {
    const refreshResult = await refreshDraftCurrentPricesForResources(client, scopeResult.data, [resourceId]);

    if (!refreshResult.ok) {
      return refreshResult;
    }
  }

  const auditResult = await insertActivityEvent(client, {
    action: "update",
    after: data,
    before: currentResult.data,
    changedFields: getChangedFields(currentResult.data, data),
    entityId: data.id,
    entityType: "recurso",
    metadata: { repository: "resourcesRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data);
}

export async function deactivateResource(
  client: DataClient,
  scope: DataScope,
  resourceId: string,
  options: OptimisticMutationOptions<Recurso, { estado: "inactivo" }> = {}
): Promise<DataResult<Recurso>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const currentResult = await getResourceById(client, scopeResult.data, resourceId);

  if (!currentResult.ok) {
    return currentResult;
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(currentResult.data, options);
  const { data, error } = await client
    .from("recursos")
    .update({ estado: "inactivo" })
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("id", resourceId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "recursos.deactivate"));
  }

  if (!data) {
    return conflictFailureFromLatest<Recurso, { estado: "inactivo" }>(client, "recursos", resourceId, expectedUpdatedAt, {
      attempted: options.attempted || { estado: "inactivo" },
      base: options.base || currentResult.data,
      entityLabel: "El recurso",
      source: "recursos.deactivate"
    });
  }

  const auditResult = await insertActivityEvent(client, {
    action: "deactivate",
    after: data,
    before: currentResult.data,
    changedFields: getChangedFields(currentResult.data, data),
    entityId: data.id,
    entityType: "recurso",
    metadata: { repository: "resourcesRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data);
}

export async function listResourcePriceHistory(
  client: DataClient,
  scope: DataScope,
  resourceId: string
): Promise<DataResult<RecursoPrecioHistorial[]>> {
  const resourceResult = await getResourceById(client, scope, resourceId);

  if (!resourceResult.ok) {
    return resourceResult;
  }

  const { data, error } = await client
    .from("recurso_precios_historial")
    .select("*")
    .eq("recurso_id", resourceId)
    .order("fecha", { ascending: false });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "recurso_precios_historial.list"));
  }

  return dataSuccess(data || []);
}

async function insertPriceHistoryIfNeeded(
  client: DataClient,
  scope: DataScope,
  before: Recurso,
  after: Recurso
): Promise<DataResult<null>> {
  const priceChange = createResourceCatalogPriceChange(before, after);

  if (!priceChange) {
    return dataSuccess(null);
  }

  const { error } = await client.from("recurso_precios_historial").insert({
    costo_transporte_anterior: priceChange.costoTransporteAnterior,
    costo_transporte_nuevo: priceChange.costoTransporteNuevo,
    costo_unitario_anterior: priceChange.costoUnitarioAnterior,
    costo_unitario_nuevo: priceChange.costoUnitarioNuevo,
    fecha: priceChange.fechaPrecio || new Date().toISOString().slice(0, 10),
    fuente_precio: priceChange.fuentePrecio,
    notas: "Cambio registrado desde la capa de datos.",
    recurso_id: after.id,
    usuario_id: scope.actorId
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "recurso_precios_historial.insert"));
  }

  return dataSuccess(null);
}

function normalizeResourceInput<T extends Partial<RecursoInput>>(input: T): T {
  return {
    ...input,
    ...(input.transporte_aplica === false ? { costo_transporte: 0 } : {})
  };
}

export const resourcesRepository = {
  canAutoUpdateDraftResourcePrice,
  createResource,
  createResourceCatalogPriceChange,
  deactivateResource,
  getResourceById,
  listResourcePriceHistory,
  listResources,
  updateResource
};
