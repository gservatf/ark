import {
  partidaApuResourceFormSchema,
  partidaInputSchema,
  type PartidaApuResourceFormInput,
  type PartidaInput
} from "../validations/items";
import { calculateApuResourcePartial } from "../calculations/apu";
import type { Partida, PartidaRecurso, Recurso } from "../../types/domain";

import { getChangedFields, insertActivityEvent } from "./audit";
import { conflictFailureFromLatest, getExpectedUpdatedAt } from "./conflicts";
import {
  dataFailure,
  dataSuccess,
  normalizeSupabaseError,
  normalizeValidationError,
  notFoundError
} from "./errors";
import { validateDataScope } from "./scope";
import type { DataClient, DataResult, DataScope, OptimisticMutationOptions } from "./types";

export type PartidaBundle = {
  partida: Partida;
  resources: PartidaRecurso[];
};

export type PartidaUpdateInput = Partial<PartidaInput>;
export type PartidaResourceUpdateInput = Partial<Omit<PartidaApuResourceFormInput, "partida_id">>;

export async function listPartidas(
  client: DataClient,
  scope: DataScope
): Promise<DataResult<Partida[]>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const { data, error } = await client
    .from("partidas")
    .select("*")
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .order("codigo", { ascending: true });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "partidas.list"));
  }

  return dataSuccess(data || []);
}

export async function getPartidaById(
  client: DataClient,
  scope: DataScope,
  partidaId: string
): Promise<DataResult<Partida>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  if (!partidaId.trim()) {
    return dataFailure(notFoundError());
  }

  const { data, error } = await client
    .from("partidas")
    .select("*")
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("id", partidaId)
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "partidas.getById"));
  }

  if (!data) {
    return dataFailure(notFoundError("No se encontró la partida seleccionada."));
  }

  return dataSuccess(data);
}

export async function getPartidaBundle(
  client: DataClient,
  scope: DataScope,
  partidaId: string
): Promise<DataResult<PartidaBundle>> {
  const partidaResult = await getPartidaById(client, scope, partidaId);

  if (!partidaResult.ok) {
    return partidaResult;
  }

  const resourcesResult = await listPartidaResources(client, scope, partidaId);

  if (!resourcesResult.ok) {
    return resourcesResult;
  }

  return dataSuccess({
    partida: partidaResult.data,
    resources: resourcesResult.data
  });
}

export async function listPartidaResources(
  client: DataClient,
  scope: DataScope,
  partidaId: string
): Promise<DataResult<PartidaRecurso[]>> {
  const partidaResult = await getPartidaById(client, scope, partidaId);

  if (!partidaResult.ok) {
    return partidaResult;
  }

  return listPartidaResourcesForValidatedScope(client, partidaId);
}

async function listPartidaResourcesForValidatedScope(
  client: DataClient,
  partidaId: string
): Promise<DataResult<PartidaRecurso[]>> {
  const { data, error } = await client
    .from("partida_recursos")
    .select("*")
    .eq("partida_id", partidaId)
    .order("orden", { ascending: true });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "partida_recursos.list"));
  }

  return dataSuccess(data || []);
}

export async function listOrganizationPartidaResources(
  client: DataClient,
  scope: DataScope
): Promise<DataResult<PartidaRecurso[]>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const { data, error } = await client
    .from("partida_recursos")
    .select("*, partida:partidas!inner(organizacion_id)")
    .eq("partida.organizacion_id", scopeResult.data.organizacionId)
    .order("orden", { ascending: true });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "partida_recursos.listOrganization"));
  }

  return dataSuccess(
    ((data || []) as Array<PartidaRecurso & { partida?: unknown }>).map(
      ({ partida: _partida, ...resource }) => resource
    )
  );
}

export async function createPartida(
  client: DataClient,
  scope: DataScope,
  input: PartidaInput
): Promise<DataResult<Partida>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const parsed = partidaInputSchema.safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const { data, error } = await client
    .from("partidas")
    .insert({
      ...parsed.data,
      organizacion_id: scopeResult.data.organizacionId
    })
    .select("*")
    .single();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "partidas.create"));
  }

  const auditResult = await insertActivityEvent(client, {
    action: "create",
    after: data,
    before: null,
    changedFields: getChangedFields(null, data),
    entityId: data.id,
    entityType: "partida",
    metadata: { repository: "itemsRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data);
}

export async function updatePartida(
  client: DataClient,
  scope: DataScope,
  partidaId: string,
  input: PartidaUpdateInput,
  options: OptimisticMutationOptions<Partida, PartidaUpdateInput> = {}
): Promise<DataResult<Partida>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const parsed = partidaInputSchema.partial().safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const currentResult = await getPartidaById(client, scopeResult.data, partidaId);

  if (!currentResult.ok) {
    return currentResult;
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(currentResult.data, options);
  const { data, error } = await client
    .from("partidas")
    .update(parsed.data)
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("id", partidaId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "partidas.update"));
  }

  if (!data) {
    return conflictFailureFromLatest<Partida, PartidaUpdateInput>(client, "partidas", partidaId, expectedUpdatedAt, {
      attempted: options.attempted || parsed.data,
      base: options.base || currentResult.data,
      entityLabel: "La partida",
      source: "partidas.update"
    });
  }

  const auditResult = await insertActivityEvent(client, {
    action: "update",
    after: data,
    before: currentResult.data,
    changedFields: getChangedFields(currentResult.data, data),
    entityId: data.id,
    entityType: "partida",
    metadata: { repository: "itemsRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data);
}

export async function deactivatePartida(
  client: DataClient,
  scope: DataScope,
  partidaId: string,
  options: OptimisticMutationOptions<Partida, PartidaUpdateInput> = {}
): Promise<DataResult<Partida>> {
  return updatePartida(client, scope, partidaId, { estado: "inactivo" }, options);
}

export async function createPartidaResource(
  client: DataClient,
  scope: DataScope,
  input: PartidaApuResourceFormInput
): Promise<DataResult<PartidaRecurso>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const parsed = partidaApuResourceFormSchema.safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const [partidaResult, resourceResult, existingResourcesResult] = await Promise.all([
    getPartidaById(client, scopeResult.data, parsed.data.partida_id),
    getCatalogResourceById(client, scopeResult.data, parsed.data.recurso_id),
    listPartidaResourcesForValidatedScope(client, parsed.data.partida_id)
  ]);

  if (!partidaResult.ok) {
    return partidaResult;
  }

  if (!resourceResult.ok) {
    return resourceResult;
  }

  if (!existingResourcesResult.ok) {
    return existingResourcesResult;
  }

  const row = buildPartidaResourceRow(
    parsed.data,
    resourceResult.data,
    parsed.data.orden ?? existingResourcesResult.data.length + 1
  );

  const { data, error } = await client
    .from("partida_recursos")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "partida_recursos.create"));
  }

  const auditResult = await insertActivityEvent(client, {
    action: "create",
    after: data,
    before: null,
    changedFields: getChangedFields(null, data),
    entityId: data.id,
    entityType: "partida_recurso",
    metadata: { partida_id: parsed.data.partida_id, repository: "itemsRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data);
}

export async function updatePartidaResource(
  client: DataClient,
  scope: DataScope,
  partidaResourceId: string,
  input: PartidaResourceUpdateInput,
  options: OptimisticMutationOptions<PartidaRecurso, PartidaResourceUpdateInput> = {}
): Promise<DataResult<PartidaRecurso>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const currentResult = await getPartidaResourceById(client, scopeResult.data, partidaResourceId);

  if (!currentResult.ok) {
    return currentResult;
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(currentResult.data, options);
  const parsed = partidaApuResourceFormSchema
    .partial()
    .safeParse({ ...input, partida_id: currentResult.data.partida_id });

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const nextResourceId = parsed.data.recurso_id || currentResult.data.recurso_id;
  const resourceResult = await getCatalogResourceById(client, scopeResult.data, nextResourceId);

  if (!resourceResult.ok) {
    return resourceResult;
  }

  const updateData = buildPartidaResourceRow(
    {
      cantidad: parsed.data.cantidad ?? currentResult.data.cantidad,
      desperdicio_porcentaje:
        parsed.data.desperdicio_porcentaje ?? currentResult.data.desperdicio_porcentaje,
      grupo: parsed.data.grupo ?? currentResult.data.grupo,
      orden: parsed.data.orden ?? currentResult.data.orden,
      partida_id: currentResult.data.partida_id,
      recurso_id: nextResourceId,
      rendimiento_factor:
        parsed.data.rendimiento_factor ?? currentResult.data.rendimiento_factor ?? 1
    },
    resourceResult.data,
    parsed.data.orden ?? currentResult.data.orden
  );

  const { data, error } = await client
    .from("partida_recursos")
    .update(updateData)
    .eq("id", partidaResourceId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "partida_recursos.update"));
  }

  if (!data) {
    return conflictFailureFromLatest<PartidaRecurso, PartidaResourceUpdateInput>(
      client,
      "partida_recursos",
      partidaResourceId,
      expectedUpdatedAt,
      {
        attempted: options.attempted || input,
        base: options.base || currentResult.data,
        entityLabel: "El recurso APU",
        source: "partida_recursos.update"
      }
    );
  }

  const auditResult = await insertActivityEvent(client, {
    action: "update",
    after: data,
    before: currentResult.data,
    changedFields: getChangedFields(currentResult.data, data),
    entityId: data.id,
    entityType: "partida_recurso",
    metadata: { partida_id: data.partida_id, repository: "itemsRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data);
}

export async function deletePartidaResource(
  client: DataClient,
  scope: DataScope,
  partidaResourceId: string,
  options: OptimisticMutationOptions<PartidaRecurso, null> = {}
): Promise<DataResult<PartidaRecurso>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const currentResult = await getPartidaResourceById(client, scopeResult.data, partidaResourceId);

  if (!currentResult.ok) {
    return currentResult;
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(currentResult.data, options);
  const { data, error } = await client
    .from("partida_recursos")
    .delete()
    .eq("id", partidaResourceId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "partida_recursos.delete"));
  }

  if (!data) {
    return conflictFailureFromLatest<PartidaRecurso, null>(client, "partida_recursos", partidaResourceId, expectedUpdatedAt, {
      attempted: null,
      base: options.base || currentResult.data,
      entityLabel: "El recurso APU",
      source: "partida_recursos.delete"
    });
  }

  const auditResult = await insertActivityEvent(client, {
    action: "delete",
    after: null,
    before: currentResult.data,
    changedFields: getChangedFields(currentResult.data, null),
    entityId: currentResult.data.id,
    entityType: "partida_recurso",
    metadata: { partida_id: currentResult.data.partida_id, repository: "itemsRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data);
}

async function getPartidaResourceById(
  client: DataClient,
  scope: DataScope,
  partidaResourceId: string
): Promise<DataResult<PartidaRecurso>> {
  const { data, error } = await client
    .from("partida_recursos")
    .select("*, partida:partidas!inner(organizacion_id)")
    .eq("id", partidaResourceId)
    .eq("partida.organizacion_id", scope.organizacionId)
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "partida_recursos.getById"));
  }

  if (!data) {
    return dataFailure(notFoundError("No se encontró el recurso APU solicitado."));
  }

  const { partida: _partida, ...resource } = data as PartidaRecurso & { partida?: unknown };

  return dataSuccess(resource);
}

async function getCatalogResourceById(
  client: DataClient,
  scope: DataScope,
  resourceId: string
): Promise<DataResult<Recurso>> {
  const { data, error } = await client
    .from("recursos")
    .select("*")
    .eq("organizacion_id", scope.organizacionId)
    .eq("id", resourceId)
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "recursos.getForPartida"));
  }

  if (!data) {
    return dataFailure(notFoundError("No se encontró el recurso seleccionado."));
  }

  return dataSuccess(data);
}

function buildPartidaResourceRow(
  input: PartidaApuResourceFormInput & { orden?: number },
  resource: Recurso,
  orden: number
): Omit<PartidaRecurso, "created_at" | "id" | "updated_at"> {
  const row = {
    cantidad: input.cantidad,
    costo_transporte_snapshot: resource.costo_transporte,
    costo_unitario_snapshot: resource.costo_unitario_actual,
    desperdicio_porcentaje: input.desperdicio_porcentaje,
    grupo: input.grupo,
    orden,
    parcial: 0,
    partida_id: input.partida_id,
    recurso_id: input.recurso_id,
    rendimiento_factor: input.rendimiento_factor ?? 1,
    unidad: resource.unidad
  };

  return {
    ...row,
    parcial: calculateApuResourcePartial(row)
  };
}

export const itemsRepository = {
  createPartida,
  createPartidaResource,
  deactivatePartida,
  deletePartidaResource,
  getPartidaBundle,
  getPartidaById,
  listOrganizationPartidaResources,
  listPartidaResources,
  listPartidas,
  updatePartida,
  updatePartidaResource
};
