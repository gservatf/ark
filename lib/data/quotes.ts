import type { RecursoProveedorPrecio } from "../../types/domain";
import {
  recursoProveedorPrecioInputSchema,
  recursoProveedorPrecioUpdateSchema,
  type RecursoProveedorPrecioInput
} from "../validations/quotes";

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

export type ResourceQuoteUpdateInput = Partial<RecursoProveedorPrecioInput>;

export async function listResourceQuotes(
  client: DataClient,
  scope: DataScope,
  resourceId: string
): Promise<DataResult<RecursoProveedorPrecio[]>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const { data, error } = await client
    .from("recurso_proveedor_precios")
    .select("*, proveedor:proveedores(*)")
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("recurso_id", resourceId)
    .order("estado", { ascending: true })
    .order("es_preferido_interno", { ascending: false })
    .order("fecha_cotizacion", { ascending: false, nullsFirst: false });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "recurso_proveedor_precios.list"));
  }

  return dataSuccess((data || []) as RecursoProveedorPrecio[]);
}

export async function listQuotesForResources(
  client: DataClient,
  scope: DataScope,
  resourceIds: string[]
): Promise<DataResult<RecursoProveedorPrecio[]>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  if (resourceIds.length === 0) {
    return dataSuccess([]);
  }

  const { data, error } = await client
    .from("recurso_proveedor_precios")
    .select("*, proveedor:proveedores(*)")
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .in("recurso_id", Array.from(new Set(resourceIds)))
    .order("fecha_cotizacion", { ascending: false, nullsFirst: false });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "recurso_proveedor_precios.listMany"));
  }

  return dataSuccess((data || []) as RecursoProveedorPrecio[]);
}

export async function getResourceQuoteById(
  client: DataClient,
  scope: DataScope,
  quoteId: string
): Promise<DataResult<RecursoProveedorPrecio>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const { data, error } = await client
    .from("recurso_proveedor_precios")
    .select("*, proveedor:proveedores(*)")
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("id", quoteId)
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "recurso_proveedor_precios.getById"));
  }

  if (!data) {
    return dataFailure(notFoundError());
  }

  return dataSuccess(data as RecursoProveedorPrecio);
}

export async function createResourceQuote(
  client: DataClient,
  scope: DataScope,
  input: RecursoProveedorPrecioInput
): Promise<DataResult<RecursoProveedorPrecio>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const parsed = recursoProveedorPrecioInputSchema.safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const preferredResult = await clearPreferredQuoteIfNeeded(
    client,
    scopeResult.data,
    parsed.data.recurso_id,
    parsed.data.es_preferido_interno
  );

  if (!preferredResult.ok) {
    return preferredResult;
  }

  const { data, error } = await client
    .from("recurso_proveedor_precios")
    .insert({
      ...parsed.data,
      organizacion_id: scopeResult.data.organizacionId
    })
    .select("*, proveedor:proveedores(*)")
    .single();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "recurso_proveedor_precios.create"));
  }

  const auditResult = await insertActivityEvent(client, {
    action: "create",
    after: data,
    before: null,
    changedFields: getChangedFields(null, data),
    entityId: data.id,
    entityType: "recurso_proveedor_precio",
    metadata: { repository: "quotesRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  const refreshResult = await refreshDraftCurrentPricesForResources(client, scopeResult.data, [data.recurso_id]);

  if (!refreshResult.ok) {
    return refreshResult;
  }

  return dataSuccess(data as RecursoProveedorPrecio);
}

export async function updateResourceQuote(
  client: DataClient,
  scope: DataScope,
  quoteId: string,
  input: ResourceQuoteUpdateInput,
  options: OptimisticMutationOptions<RecursoProveedorPrecio, ResourceQuoteUpdateInput> = {}
): Promise<DataResult<RecursoProveedorPrecio>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const parsed = recursoProveedorPrecioUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const currentResult = await getResourceQuoteById(client, scopeResult.data, quoteId);

  if (!currentResult.ok) {
    return currentResult;
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(currentResult.data, options);

  const nextResourceId = parsed.data.recurso_id || currentResult.data.recurso_id;
  const preferredResult = await clearPreferredQuoteIfNeeded(
    client,
    scopeResult.data,
    nextResourceId,
    parsed.data.es_preferido_interno === true,
    quoteId
  );

  if (!preferredResult.ok) {
    return preferredResult;
  }

  const { data, error } = await client
    .from("recurso_proveedor_precios")
    .update(parsed.data)
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("id", quoteId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*, proveedor:proveedores(*)")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "recurso_proveedor_precios.update"));
  }

  if (!data) {
    return conflictFailureFromLatest<RecursoProveedorPrecio, ResourceQuoteUpdateInput>(
      client,
      "recurso_proveedor_precios",
      quoteId,
      expectedUpdatedAt,
      {
        attempted: options.attempted || parsed.data,
        base: options.base || currentResult.data,
        entityLabel: "La cotización",
        source: "recurso_proveedor_precios.update"
      }
    );
  }

  const auditResult = await insertActivityEvent(client, {
    action: "update",
    after: data,
    before: currentResult.data,
    changedFields: getChangedFields(currentResult.data, data),
    entityId: quoteId,
    entityType: "recurso_proveedor_precio",
    metadata: { repository: "quotesRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  const refreshResult = await refreshDraftCurrentPricesForResources(client, scopeResult.data, [data.recurso_id]);

  if (!refreshResult.ok) {
    return refreshResult;
  }

  return dataSuccess(data as RecursoProveedorPrecio);
}

export async function deactivateResourceQuote(
  client: DataClient,
  scope: DataScope,
  quoteId: string,
  options: OptimisticMutationOptions<RecursoProveedorPrecio, ResourceQuoteUpdateInput> = {}
): Promise<DataResult<RecursoProveedorPrecio>> {
  return updateResourceQuote(client, scope, quoteId, {
    es_preferido_interno: false,
    estado: "inactivo"
  }, options);
}

async function clearPreferredQuoteIfNeeded(
  client: DataClient,
  scope: DataScope,
  resourceId: string,
  shouldClear: boolean,
  exceptQuoteId?: string
): Promise<DataResult<null>> {
  if (!shouldClear) {
    return dataSuccess(null);
  }

  let query = client
    .from("recurso_proveedor_precios")
    .update({ es_preferido_interno: false })
    .eq("organizacion_id", scope.organizacionId)
    .eq("recurso_id", resourceId)
    .eq("estado", "activo")
    .eq("es_preferido_interno", true);

  if (exceptQuoteId) {
    query = query.neq("id", exceptQuoteId);
  }

  const { error } = await query;

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "recurso_proveedor_precios.clearPreferred"));
  }

  return dataSuccess(null);
}

export const quotesRepository = {
  createResourceQuote,
  deactivateResourceQuote,
  getResourceQuoteById,
  listQuotesForResources,
  listResourceQuotes,
  updateResourceQuote
};
