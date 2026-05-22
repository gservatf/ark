import {
  resolveClientPriceForResource,
  type QuoteWithProvider
} from "../../calculations/client-prices";
import { precioClienteOverrideSchema, type PrecioClienteOverrideInput } from "../../validations/quotes";
import type { PresupuestoBorradorPartidaRecurso } from "../../../types/domain";

import { getChangedFields, insertActivityEvent } from "../audit";
import { conflictFailureFromLatest, getExpectedUpdatedAt } from "../conflicts";
import {
  dataFailure,
  normalizeSupabaseError,
  normalizeValidationError,
  notFoundError,
  validationError
} from "../errors";
import { listQuotesForResources } from "../quotes";
import { validateDataScope } from "../scope";
import type { DataClient, DataResult, DataScope, OptimisticMutationOptions } from "../types";

import { getActiveBudgetDraft, recalculateDraftLinePrices } from "./drafts";
import type { BudgetDraftBundle, ClientQuoteSelectionInput, PriceLockInput } from "./types";

export async function setDraftResourcePriceLock(
  client: DataClient,
  scope: DataScope,
  resourceId: string,
  input: PriceLockInput,
  options: OptimisticMutationOptions<PresupuestoBorradorPartidaRecurso, PriceLockInput> = {}
): Promise<DataResult<BudgetDraftBundle>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const { data: currentResource, error: currentError } = await client
    .from("presupuesto_borrador_partida_recursos")
    .select("*")
    .eq("id", resourceId)
    .maybeSingle();

  if (currentError) {
    return dataFailure(normalizeSupabaseError(currentError, "presupuesto_borrador_recursos.getForLock"));
  }

  if (!currentResource) {
    return dataFailure(notFoundError("No se encontró el recurso del borrador."));
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(currentResource as PresupuestoBorradorPartidaRecurso, options);
  const { data, error } = await client
    .from("presupuesto_borrador_partida_recursos")
    .update({
      autoactualizar_precio: !input.precio_fijado,
      motivo_precio_fijado: input.precio_fijado ? input.motivo_precio_fijado || null : null,
      precio_fijado: input.precio_fijado,
      precio_origen: input.precio_fijado ? "snapshot" : "catalogo"
    })
    .eq("id", resourceId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "presupuesto_borrador_recursos.lock"));
  }

  if (!data) {
    return conflictFailureFromLatest<PresupuestoBorradorPartidaRecurso, PriceLockInput>(
      client,
      "presupuesto_borrador_partida_recursos",
      resourceId,
      expectedUpdatedAt,
      {
        attempted: options.attempted || input,
        base: options.base || currentResource,
        entityLabel: "El recurso del presupuesto",
        source: "presupuesto_borrador_recursos.lock"
      }
    );
  }

  const updatedBundle = await recalculateDraftLinePrices(client, scopeResult.data, data.presupuesto_borrador_id);

  if (!updatedBundle.ok) {
    return updatedBundle;
  }

  await insertActivityEvent(client, {
    action: input.precio_fijado ? "fix_resource_price" : "unfix_resource_price",
    after: data,
    before: currentResource,
    changedFields: { precio_fijado: { after: input.precio_fijado, before: !input.precio_fijado } },
    entityId: resourceId,
    entityType: "presupuesto_borrador_recurso",
    metadata: { repository: "budgetsRepository" },
    presupuestoBorradorId: data.presupuesto_borrador_id,
    scope: scopeResult.data
  });

  return updatedBundle;
}

export async function selectDraftResourceClientQuote(
  client: DataClient,
  scope: DataScope,
  draftResourceId: string,
  input: ClientQuoteSelectionInput,
  options: OptimisticMutationOptions<PresupuestoBorradorPartidaRecurso, ClientQuoteSelectionInput> = {}
): Promise<DataResult<BudgetDraftBundle>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const { data: resource, error: resourceError } = await client
    .from("presupuesto_borrador_partida_recursos")
    .select("*")
    .eq("id", draftResourceId)
    .maybeSingle();

  if (resourceError) {
    return dataFailure(normalizeSupabaseError(resourceError, "presupuesto_borrador_recursos.getForClientQuote"));
  }

  if (!resource || !resource.recurso_id) {
    return dataFailure(notFoundError("No se encontró el recurso del borrador."));
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(resource as PresupuestoBorradorPartidaRecurso, options);
  let updateData: Partial<PresupuestoBorradorPartidaRecurso>;

  if (input.quoteId) {
    const { data: quote, error: quoteError } = await client
      .from("recurso_proveedor_precios")
      .select("*, proveedor:proveedores(*)")
      .eq("organizacion_id", scopeResult.data.organizacionId)
      .eq("recurso_id", resource.recurso_id)
      .eq("id", input.quoteId)
      .maybeSingle();

    if (quoteError) {
      return dataFailure(normalizeSupabaseError(quoteError, "recurso_proveedor_precios.selectClient"));
    }

    if (!quote) {
      return dataFailure(notFoundError("No se encontró la cotización seleccionada."));
    }

    const selectedQuote = quote as QuoteWithProvider;

    updateData = {
      cotizacion_cliente_id: selectedQuote.id,
      motivo_precio_cliente_override: null,
      precio_cliente_actual: selectedQuote.costo_unitario + selectedQuote.costo_transporte,
      precio_cliente_advertencia: selectedQuote.proveedor?.disponible_para_cliente
        ? null
        : "Cotizacion no visible para cliente seleccionada como fallback.",
      precio_cliente_origen: selectedQuote.proveedor?.disponible_para_cliente ? "proveedor_visible" : "fallback_general",
      precio_cliente_override: false
    };
  } else {
    const quoteResult = await listQuotesForResources(client, scopeResult.data, [resource.recurso_id]);

    if (!quoteResult.ok) {
      return quoteResult;
    }

    const clientPrice = resolveClientPriceForResource(quoteResult.data as QuoteWithProvider[]);

    if (!clientPrice) {
      return dataFailure(validationError("No hay cotizaciones activas para resolver el precio cliente."));
    }

    updateData = {
      cotizacion_cliente_id: clientPrice.cotizacion?.id || null,
      motivo_precio_cliente_override: null,
      precio_cliente_actual: clientPrice.precio,
      precio_cliente_advertencia: clientPrice.advertencia,
      precio_cliente_origen: clientPrice.origen,
      precio_cliente_override: false
    };
  }

  const { data, error } = await client
    .from("presupuesto_borrador_partida_recursos")
    .update(updateData)
    .eq("id", draftResourceId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "presupuesto_borrador_recursos.selectClientQuote"));
  }

  if (!data) {
    return conflictFailureFromLatest<PresupuestoBorradorPartidaRecurso, ClientQuoteSelectionInput>(
      client,
      "presupuesto_borrador_partida_recursos",
      draftResourceId,
      expectedUpdatedAt,
      {
        attempted: options.attempted || input,
        base: options.base || resource,
        entityLabel: "El precio cliente",
        source: "presupuesto_borrador_recursos.selectClientQuote"
      }
    );
  }

  await insertActivityEvent(client, {
    action: "select_precio_cliente",
    after: data,
    before: resource,
    changedFields: getChangedFields(resource, data),
    entityId: draftResourceId,
    entityType: "presupuesto_borrador_recurso",
    metadata: { repository: "budgetsRepository" },
    presupuestoBorradorId: data.presupuesto_borrador_id,
    scope: scopeResult.data
  });

  return getActiveBudgetDraft(client, scopeResult.data);
}

export async function overrideDraftClientPrice(
  client: DataClient,
  scope: DataScope,
  draftResourceId: string,
  input: PrecioClienteOverrideInput,
  options: OptimisticMutationOptions<PresupuestoBorradorPartidaRecurso, PrecioClienteOverrideInput> = {}
): Promise<DataResult<BudgetDraftBundle>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const parsed = precioClienteOverrideSchema.safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const { data: currentResource, error: currentError } = await client
    .from("presupuesto_borrador_partida_recursos")
    .select("*")
    .eq("id", draftResourceId)
    .maybeSingle();

  if (currentError) {
    return dataFailure(normalizeSupabaseError(currentError, "presupuesto_borrador_recursos.getForOverride"));
  }

  if (!currentResource) {
    return dataFailure(notFoundError("No se encontró el recurso del borrador."));
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(currentResource as PresupuestoBorradorPartidaRecurso, options);
  const { data, error } = await client
    .from("presupuesto_borrador_partida_recursos")
    .update({
      motivo_precio_cliente_override: parsed.data.motivo_precio_cliente_override,
      precio_cliente_actual: parsed.data.precio_cliente_actual,
      precio_cliente_advertencia: null,
      precio_cliente_origen: "override_manual",
      precio_cliente_override: true
    })
    .eq("id", draftResourceId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "presupuesto_borrador_recursos.overrideClient"));
  }

  if (!data) {
    return conflictFailureFromLatest<PresupuestoBorradorPartidaRecurso, PrecioClienteOverrideInput>(
      client,
      "presupuesto_borrador_partida_recursos",
      draftResourceId,
      expectedUpdatedAt,
      {
        attempted: options.attempted || parsed.data,
        base: options.base || currentResource,
        entityLabel: "El precio cliente",
        source: "presupuesto_borrador_recursos.overrideClient"
      }
    );
  }

  await insertActivityEvent(client, {
    action: "override_precio_cliente",
    after: data,
    before: currentResource,
    changedFields: { precio_cliente_actual: { after: parsed.data.precio_cliente_actual, before: null } },
    entityId: draftResourceId,
    entityType: "presupuesto_borrador_recurso",
    metadata: { repository: "budgetsRepository" },
    presupuestoBorradorId: data.presupuesto_borrador_id,
    scope: scopeResult.data
  });

  return getActiveBudgetDraft(client, scopeResult.data);
}
