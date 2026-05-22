import type {
  PresupuestoBorrador,
  PresupuestoVersion,
  PresupuestoVersionPartida,
  PresupuestoVersionPartidaRecurso
} from "../../../types/domain";

import { getExpectedUpdatedAt } from "../conflicts";
import { dataFailure, dataSuccess, normalizeSupabaseError, notFoundError, validationError } from "../errors";
import { validateDataScope } from "../scope";
import type { DataClient, DataResult, DataScope, OptimisticMutationOptions } from "../types";

import { getActiveBudgetDraft } from "./drafts";
import type { OfficialBudgetVersionBundle } from "./types";

export async function getOfficialBudgetVersion(
  client: DataClient,
  scope: DataScope,
  versionId: string
): Promise<DataResult<OfficialBudgetVersionBundle>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const { data: version, error: versionError } = await client
    .from("presupuesto_versiones")
    .select("*")
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("id", versionId)
    .maybeSingle();

  if (versionError) {
    return dataFailure(normalizeSupabaseError(versionError, "presupuesto_versiones.get"));
  }

  if (!version) {
    return dataFailure(notFoundError("No se encontró la versión oficial."));
  }

  const [linesResult, resourcesResult] = await Promise.all([
    client
      .from("presupuesto_version_partidas")
      .select("*")
      .eq("presupuesto_version_id", versionId)
      .order("orden", { ascending: true }),
    client
      .from("presupuesto_version_partida_recursos")
      .select("*")
      .eq("presupuesto_version_id", versionId)
      .order("orden", { ascending: true })
  ]);

  if (linesResult.error) {
    return dataFailure(normalizeSupabaseError(linesResult.error, "presupuesto_version_partidas.list"));
  }

  if (resourcesResult.error) {
    return dataFailure(normalizeSupabaseError(resourcesResult.error, "presupuesto_version_recursos.list"));
  }

  return dataSuccess({
    lines: (linesResult.data || []) as PresupuestoVersionPartida[],
    resources: (resourcesResult.data || []) as PresupuestoVersionPartidaRecurso[],
    version: version as PresupuestoVersion
  });
}

export async function emitOfficialBudgetVersion(
  client: DataClient,
  scope: DataScope,
  draftId: string,
  options: OptimisticMutationOptions<PresupuestoBorrador, null> = {}
): Promise<DataResult<OfficialBudgetVersionBundle>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const resolvedResult = await getActiveBudgetDraft(client, scopeResult.data);

  if (!resolvedResult.ok) {
    return resolvedResult;
  }

  const { draft, lines } = resolvedResult.data;
  if (draft.id !== draftId) {
    return dataFailure(validationError("El borrador solicitado no pertenece al proyecto activo."));
  }

  if (lines.length === 0) {
    return dataFailure(validationError("No se puede emitir un borrador vacio."));
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(draft, options);

  const { data, error } = await client.rpc("emit_official_budget_version", {
    p_draft_id: draftId,
    p_expected_updated_at: expectedUpdatedAt
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "presupuesto_versiones.emitRpc"));
  }

  const bundle = data as unknown as OfficialBudgetVersionBundle;

  return dataSuccess({
    lines: bundle.lines || [],
    resources: bundle.resources || [],
    version: bundle.version
  });
}
