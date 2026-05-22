import type {
  PresupuestoBorrador,
  PresupuestoBorradorPartida,
  PresupuestoBorradorPartidaRecurso,
  PresupuestoVersion
} from "../../../types/domain";
import { budgetDraftUpdateSchema } from "../../validations/budgets";

import { getChangedFields, insertActivityEvent } from "../audit";
import { conflictFailureFromLatest, getExpectedUpdatedAt } from "../conflicts";
import {
  dataFailure,
  dataSuccess,
  normalizeSupabaseError,
  normalizeValidationError,
  notFoundError,
  validationError
} from "../errors";
import { validateDataScope } from "../scope";
import type { DataClient, DataResult, DataScope, OptimisticMutationOptions } from "../types";

import type { BudgetDraftBundle, BudgetDraftUpdateInput } from "./types";

export async function ensureActiveBudgetDraft(
  client: DataClient,
  scope: DataScope
): Promise<DataResult<BudgetDraftBundle>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  if (!scopeResult.data.proyectoId) {
    return dataFailure(validationError("El proyecto es obligatorio para crear un borrador."));
  }

  const currentResult = await getActiveBudgetDraft(client, scopeResult.data);

  if (currentResult.ok) {
    return currentResult;
  }

  if (currentResult.error.code !== "not_found") {
    return currentResult;
  }

  const { data: project, error: projectError } = await client
    .from("proyectos")
    .select("*")
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("id", scopeResult.data.proyectoId)
    .maybeSingle();

  if (projectError) {
    return dataFailure(normalizeSupabaseError(projectError, "proyectos.getForDraft"));
  }

  if (!project) {
    return dataFailure(notFoundError("No se encontró el proyecto para crear el borrador."));
  }

  const { data: draft, error: draftError } = await client
    .from("presupuesto_borradores")
    .insert({
      cliente: project.cliente,
      created_by: scopeResult.data.actorId,
      gastos_generales_porcentaje: 10,
      igv_porcentaje: 18,
      moneda: "PEN",
      nombre: `${project.nombre}_Presupuesto`,
      organizacion_id: scopeResult.data.organizacionId,
      proyecto_id: project.id,
      ubicacion: project.ubicacion,
      utilidad_porcentaje: 10,
      updated_by: scopeResult.data.actorId
    })
    .select("*")
    .single();

  if (draftError) {
    return dataFailure(normalizeSupabaseError(draftError, "presupuesto_borradores.ensure"));
  }

  await insertActivityEvent(client, {
    action: "create_draft",
    after: draft,
    before: null,
    changedFields: getChangedFields(null, draft),
    entityId: draft.id,
    entityType: "presupuesto_borrador",
    metadata: { repository: "budgetsRepository" },
    presupuestoBorradorId: draft.id,
    scope: scopeResult.data
  });

  return getActiveBudgetDraft(client, scopeResult.data);
}

export async function getActiveBudgetDraft(
  client: DataClient,
  scope: DataScope
): Promise<DataResult<BudgetDraftBundle>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  if (!scopeResult.data.proyectoId) {
    return dataFailure(validationError("El proyecto es obligatorio para consultar presupuestos."));
  }

  const { data: draft, error: draftError } = await client
    .from("presupuesto_borradores")
    .select("*")
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("proyecto_id", scopeResult.data.proyectoId)
    .eq("estado", "activo")
    .maybeSingle();

  if (draftError) {
    return dataFailure(normalizeSupabaseError(draftError, "presupuesto_borradores.getActive"));
  }

  if (!draft) {
    return dataFailure(notFoundError("No se encontró un presupuesto borrador activo."));
  }

  const [linesResult, resourcesResult, versionsResult] = await Promise.all([
    client
      .from("presupuesto_borrador_partidas")
      .select("*")
      .eq("presupuesto_borrador_id", draft.id)
      .order("orden", { ascending: true }),
    client
      .from("presupuesto_borrador_partida_recursos")
      .select("*")
      .eq("presupuesto_borrador_id", draft.id)
      .order("orden", { ascending: true }),
    client
      .from("presupuesto_versiones")
      .select("*")
      .eq("organizacion_id", scopeResult.data.organizacionId)
      .eq("proyecto_id", scopeResult.data.proyectoId)
      .order("numero_version", { ascending: false })
  ]);

  if (linesResult.error) {
    return dataFailure(normalizeSupabaseError(linesResult.error, "presupuesto_borrador_partidas.list"));
  }

  if (resourcesResult.error) {
    return dataFailure(normalizeSupabaseError(resourcesResult.error, "presupuesto_borrador_recursos.list"));
  }

  if (versionsResult.error) {
    return dataFailure(normalizeSupabaseError(versionsResult.error, "presupuesto_versiones.list"));
  }

  return dataSuccess({
    draft: draft as PresupuestoBorrador,
    lines: (linesResult.data || []) as PresupuestoBorradorPartida[],
    resources: (resourcesResult.data || []) as PresupuestoBorradorPartidaRecurso[],
    versions: (versionsResult.data || []) as PresupuestoVersion[]
  });
}

export async function updateBudgetDraft(
  client: DataClient,
  scope: DataScope,
  draftId: string,
  input: BudgetDraftUpdateInput,
  options: OptimisticMutationOptions<PresupuestoBorrador, BudgetDraftUpdateInput> = {}
): Promise<DataResult<BudgetDraftBundle>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const rawInput = input as Record<string, unknown>;
  const parsed = budgetDraftUpdateSchema.safeParse({
    cliente: rawInput.cliente,
    gastos_generales_porcentaje: rawInput.gastos_generales_porcentaje,
    igv_porcentaje: rawInput.igv_porcentaje,
    nombre: rawInput.nombre,
    ubicacion: rawInput.ubicacion,
    utilidad_porcentaje: rawInput.utilidad_porcentaje
  });

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const updatePayload: BudgetDraftUpdateInput = {
    cliente: parsed.data.cliente,
    gastos_generales_porcentaje: parsed.data.gastos_generales_porcentaje,
    igv_porcentaje: parsed.data.igv_porcentaje,
    nombre: parsed.data.nombre,
    ubicacion: parsed.data.ubicacion,
    utilidad_porcentaje: parsed.data.utilidad_porcentaje
  };
  const allowedPayload = Object.fromEntries(
    Object.entries(updatePayload).filter(([, value]) => value !== undefined)
  ) as BudgetDraftUpdateInput;

  const currentResult = await getActiveBudgetDraft(client, scopeResult.data);

  if (!currentResult.ok) {
    return currentResult;
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(currentResult.data.draft, options);
  const { data, error } = await client
    .from("presupuesto_borradores")
    .update({
      ...allowedPayload,
      updated_by: scopeResult.data.actorId
    })
    .eq("id", draftId)
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "presupuesto_borradores.update"));
  }

  if (!data) {
    return conflictFailureFromLatest<PresupuestoBorrador, BudgetDraftUpdateInput>(
      client,
      "presupuesto_borradores",
      draftId,
      expectedUpdatedAt,
      {
        attempted: options.attempted || input,
        base: options.base || currentResult.data.draft,
        entityLabel: "El borrador",
        source: "presupuesto_borradores.update"
      }
    );
  }

  const updatedBundle = await recalculateDraftTotals(client, scopeResult.data, draftId);

  if (!updatedBundle.ok) {
    return updatedBundle;
  }

  await insertActivityEvent(client, {
    action: "update_draft",
    after: data,
    before: currentResult.data.draft,
    changedFields: getChangedFields(currentResult.data.draft, data),
    entityId: draftId,
    entityType: "presupuesto_borrador",
    metadata: { repository: "budgetsRepository" },
    presupuestoBorradorId: draftId,
    scope: scopeResult.data
  });

  return updatedBundle;
}

export async function refreshDraftCurrentPrices(
  client: DataClient,
  scope: DataScope,
  draftId: string
): Promise<DataResult<BudgetDraftBundle>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const { error } = await client.rpc("refresh_draft_current_prices", {
    p_draft_id: draftId
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "presupuesto_borradores.refreshPricesRpc"));
  }

  return getActiveBudgetDraft(client, scopeResult.data);
}

export async function refreshDraftCurrentPricesForResources(
  client: DataClient,
  scope: DataScope,
  resourceIds: string[]
): Promise<DataResult<null>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const uniqueResourceIds = Array.from(new Set(resourceIds.filter(Boolean)));

  if (uniqueResourceIds.length === 0) {
    return dataSuccess(null);
  }

  const { error } = await client.rpc("refresh_draft_current_prices_for_resources", {
    p_resource_ids: uniqueResourceIds
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "presupuesto_borradores.refreshPricesForResourcesRpc"));
  }

  return dataSuccess(null);
}

export async function resolveDraftClientPrices(
  client: DataClient,
  scope: DataScope,
  draftId: string
): Promise<DataResult<BudgetDraftBundle>> {
  return refreshDraftCurrentPrices(client, scope, draftId);
}

export async function recalculateDraftLinePrices(
  client: DataClient,
  scope: DataScope,
  draftId: string
): Promise<DataResult<BudgetDraftBundle>> {
  return recalculateDraftTotals(client, scope, draftId);
}

export async function recalculateDraftTotals(
  client: DataClient,
  scope: DataScope,
  draftId: string
): Promise<DataResult<BudgetDraftBundle>> {
  const { data, error } = await client.rpc("recalculate_budget_draft_totals", {
    p_draft_id: draftId
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "presupuesto_borradores.recalculateTotalsRpc"));
  }

  const bundle = data as unknown as BudgetDraftBundle | null;

  if (!bundle?.draft) {
    return getActiveBudgetDraft(client, scope);
  }

  return dataSuccess({
    draft: bundle.draft,
    lines: bundle.lines || [],
    resources: bundle.resources || [],
    versions: bundle.versions || []
  });
}
