import { calculateBudgetLinePartial } from "../../calculations/budget";
import type { PresupuestoBorradorPartida } from "../../../types/domain";

import { getChangedFields, insertActivityEvent } from "../audit";
import { conflictFailureFromLatest, getExpectedUpdatedAt } from "../conflicts";
import { dataFailure, normalizeSupabaseError, notFoundError } from "../errors";
import { validateDataScope } from "../scope";
import type { DataClient, DataResult, DataScope, OptimisticMutationOptions } from "../types";

import { getActiveBudgetDraft, recalculateDraftTotals } from "./drafts";
import type { BudgetDraftBundle, PriceLockInput } from "./types";

export async function addDraftPartida(
  client: DataClient,
  scope: DataScope,
  draftId: string,
  partidaId: string
): Promise<DataResult<BudgetDraftBundle>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const { error } = await client.rpc("add_draft_partida", {
    p_draft_id: draftId,
    p_partida_id: partidaId
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "presupuesto_borradores.addPartidaRpc"));
  }

  return getActiveBudgetDraft(client, scopeResult.data);
}

export async function updateDraftLineMetrado(
  client: DataClient,
  scope: DataScope,
  line: PresupuestoBorradorPartida,
  metrado: number,
  options: OptimisticMutationOptions<PresupuestoBorradorPartida, { metrado: number }> = {}
): Promise<DataResult<BudgetDraftBundle>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const nextLine = {
    ...line,
    metrado,
    parcial: calculateBudgetLinePartial({
      metrado,
      precio_unitario_snapshot: line.precio_unitario_actual
    })
  };
  const expectedUpdatedAt = getExpectedUpdatedAt(line, options);

  const { data, error } = await client
    .from("presupuesto_borrador_partidas")
    .update({
      metrado: nextLine.metrado,
      parcial: nextLine.parcial
    })
    .eq("id", line.id)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "presupuesto_borrador_partidas.updateMetrado"));
  }

  if (!data) {
    return conflictFailureFromLatest<PresupuestoBorradorPartida, { metrado: number }>(
      client,
      "presupuesto_borrador_partidas",
      line.id,
      expectedUpdatedAt,
      {
        attempted: options.attempted || { metrado },
        base: options.base || line,
        entityLabel: "La partida del presupuesto",
        source: "presupuesto_borrador_partidas.updateMetrado"
      }
    );
  }

  const updatedBundle = await recalculateDraftTotals(client, scopeResult.data, line.presupuesto_borrador_id);

  if (!updatedBundle.ok) {
    return updatedBundle;
  }

  await insertActivityEvent(client, {
    action: "update_metrado",
    after: data,
    before: line,
    changedFields: getChangedFields(line, data),
    entityId: line.id,
    entityType: "presupuesto_borrador_partida",
    metadata: { repository: "budgetsRepository" },
    presupuestoBorradorId: line.presupuesto_borrador_id,
    scope: scopeResult.data
  });

  return updatedBundle;
}

export async function removeDraftLine(
  client: DataClient,
  scope: DataScope,
  line: PresupuestoBorradorPartida,
  options: OptimisticMutationOptions<PresupuestoBorradorPartida, null> = {}
): Promise<DataResult<BudgetDraftBundle>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(line, options);
  const { data: removedLine, error } = await client
    .from("presupuesto_borrador_partidas")
    .delete()
    .eq("id", line.id)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "presupuesto_borrador_partidas.remove"));
  }

  if (!removedLine) {
    return conflictFailureFromLatest<PresupuestoBorradorPartida, null>(
      client,
      "presupuesto_borrador_partidas",
      line.id,
      expectedUpdatedAt,
      {
        attempted: null,
        base: options.base || line,
        entityLabel: "La partida del presupuesto",
        source: "presupuesto_borrador_partidas.remove"
      }
    );
  }

  const updatedBundle = await recalculateDraftTotals(client, scopeResult.data, line.presupuesto_borrador_id);

  if (!updatedBundle.ok) {
    return updatedBundle;
  }

  await insertActivityEvent(client, {
    action: "remove_partida",
    after: null,
    before: line,
    changedFields: getChangedFields(line, null),
    entityId: line.id,
    entityType: "presupuesto_borrador_partida",
    metadata: { repository: "budgetsRepository" },
    presupuestoBorradorId: line.presupuesto_borrador_id,
    scope: scopeResult.data
  });

  return updatedBundle;
}

export async function setDraftLinePriceLock(
  client: DataClient,
  scope: DataScope,
  lineId: string,
  input: PriceLockInput,
  options: OptimisticMutationOptions<PresupuestoBorradorPartida, PriceLockInput> = {}
): Promise<DataResult<BudgetDraftBundle>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const { data: currentLine, error: currentError } = await client
    .from("presupuesto_borrador_partidas")
    .select("*")
    .eq("id", lineId)
    .maybeSingle();

  if (currentError) {
    return dataFailure(normalizeSupabaseError(currentError, "presupuesto_borrador_partidas.getForLock"));
  }

  if (!currentLine) {
    return dataFailure(notFoundError("No se encontró la línea del borrador."));
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(currentLine as PresupuestoBorradorPartida, options);
  const { data, error } = await client
    .from("presupuesto_borrador_partidas")
    .update({
      autoactualizar_precio: !input.precio_fijado,
      motivo_precio_fijado: input.precio_fijado ? input.motivo_precio_fijado || null : null,
      precio_fijado: input.precio_fijado,
      precio_origen: input.precio_fijado ? "snapshot" : "catalogo"
    })
    .eq("id", lineId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "presupuesto_borrador_partidas.lock"));
  }

  if (!data) {
    return conflictFailureFromLatest<PresupuestoBorradorPartida, PriceLockInput>(
      client,
      "presupuesto_borrador_partidas",
      lineId,
      expectedUpdatedAt,
      {
        attempted: options.attempted || input,
        base: options.base || currentLine,
        entityLabel: "La partida del presupuesto",
        source: "presupuesto_borrador_partidas.lock"
      }
    );
  }

  const updatedBundle = await recalculateDraftTotals(client, scopeResult.data, data.presupuesto_borrador_id);

  if (!updatedBundle.ok) {
    return updatedBundle;
  }

  await insertActivityEvent(client, {
    action: input.precio_fijado ? "fix_line_price" : "unfix_line_price",
    after: data,
    before: currentLine,
    changedFields: { precio_fijado: { after: input.precio_fijado, before: !input.precio_fijado } },
    entityId: lineId,
    entityType: "presupuesto_borrador_partida",
    metadata: { repository: "budgetsRepository" },
    presupuestoBorradorId: data.presupuesto_borrador_id,
    scope: scopeResult.data
  });

  return updatedBundle;
}
