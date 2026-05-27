import type {
  PartidaCategoria,
  PartidaSubcategoria,
  UnidadMedida
} from "@/types/domain";

import {
  partidaCategoriaInputSchema,
  partidaSubcategoriaInputSchema,
  unidadMedidaInputSchema,
  type PartidaCategoriaInput,
  type PartidaSubcategoriaInput,
  type UnidadMedidaInput
} from "../validations/partida-catalogs";

import { getChangedFields, insertActivityEvent } from "./audit";
import {
  dataFailure,
  dataSuccess,
  normalizeSupabaseError,
  normalizeValidationError,
  notFoundError
} from "./errors";
import { validateDataScope } from "./scope";
import type { DataClient, DataResult, DataScope } from "./types";

export type PartidaCatalogs = {
  categorias: PartidaCategoria[];
  subcategorias: PartidaSubcategoria[];
  unidades: UnidadMedida[];
};

export type UnidadMedidaUpdateInput = Partial<UnidadMedidaInput>;

export async function listPartidaCatalogs(
  client: DataClient,
  scope: DataScope
): Promise<DataResult<PartidaCatalogs>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const [categoriasResult, subcategoriasResult, unidadesResult] = await Promise.all([
    client
      .from("partida_categorias")
      .select("*")
      .eq("organizacion_id", scopeResult.data.organizacionId)
      .order("nombre", { ascending: true }),
    client
      .from("partida_subcategorias")
      .select("*")
      .eq("organizacion_id", scopeResult.data.organizacionId)
      .order("nombre", { ascending: true }),
    client
      .from("unidades_medida")
      .select("*")
      .eq("organizacion_id", scopeResult.data.organizacionId)
      .order("codigo", { ascending: true })
  ]);

  if (categoriasResult.error) {
    return dataFailure(normalizeSupabaseError(categoriasResult.error, "partida_catalogs.categorias.list"));
  }

  if (subcategoriasResult.error) {
    return dataFailure(normalizeSupabaseError(subcategoriasResult.error, "partida_catalogs.subcategorias.list"));
  }

  if (unidadesResult.error) {
    return dataFailure(normalizeSupabaseError(unidadesResult.error, "partida_catalogs.unidades.list"));
  }

  return dataSuccess({
    categorias: (categoriasResult.data || []) as unknown as PartidaCategoria[],
    subcategorias: (subcategoriasResult.data || []) as unknown as PartidaSubcategoria[],
    unidades: (unidadesResult.data || []) as unknown as UnidadMedida[]
  });
}

export async function createPartidaCategoria(
  client: DataClient,
  scope: DataScope,
  input: PartidaCategoriaInput
): Promise<DataResult<PartidaCategoria>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const parsed = partidaCategoriaInputSchema.safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const { data, error } = await client
    .from("partida_categorias")
    .insert({
      ...parsed.data,
      organizacion_id: scopeResult.data.organizacionId
    } as never)
    .select("*")
    .single();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "partida_catalogs.categorias.create"));
  }

  const auditResult = await insertActivityEvent(client, {
    action: "create",
    after: data,
    before: null,
    changedFields: getChangedFields(null, data),
    entityId: data.id,
    entityType: "partida_categoria",
    metadata: { repository: "partidaCatalogsRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data as unknown as PartidaCategoria);
}

export async function createPartidaSubcategoria(
  client: DataClient,
  scope: DataScope,
  input: PartidaSubcategoriaInput
): Promise<DataResult<PartidaSubcategoria>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const parsed = partidaSubcategoriaInputSchema.safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const { data, error } = await client
    .from("partida_subcategorias")
    .insert({
      ...parsed.data,
      organizacion_id: scopeResult.data.organizacionId
    } as never)
    .select("*")
    .single();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "partida_catalogs.subcategorias.create"));
  }

  const auditResult = await insertActivityEvent(client, {
    action: "create",
    after: data,
    before: null,
    changedFields: getChangedFields(null, data),
    entityId: data.id,
    entityType: "partida_subcategoria",
    metadata: { repository: "partidaCatalogsRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data as unknown as PartidaSubcategoria);
}

export async function createUnidadMedida(
  client: DataClient,
  scope: DataScope,
  input: UnidadMedidaInput
): Promise<DataResult<UnidadMedida>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const parsed = unidadMedidaInputSchema.safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const { data, error } = await client
    .from("unidades_medida")
    .insert({
      ...parsed.data,
      organizacion_id: scopeResult.data.organizacionId
    } as never)
    .select("*")
    .single();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "partida_catalogs.unidades.create"));
  }

  const auditResult = await insertActivityEvent(client, {
    action: "create",
    after: data,
    before: null,
    changedFields: getChangedFields(null, data),
    entityId: data.id,
    entityType: "unidad_medida",
    metadata: { repository: "partidaCatalogsRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data as unknown as UnidadMedida);
}

export async function updateUnidadMedida(
  client: DataClient,
  scope: DataScope,
  unidadId: string,
  input: UnidadMedidaUpdateInput
): Promise<DataResult<UnidadMedida>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  if (!unidadId.trim()) {
    return dataFailure(notFoundError("No se encontro la unidad seleccionada."));
  }

  const parsed = unidadMedidaInputSchema.partial().safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const { data: current, error: currentError } = await client
    .from("unidades_medida")
    .select("*")
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("id", unidadId)
    .maybeSingle();

  if (currentError) {
    return dataFailure(normalizeSupabaseError(currentError, "partida_catalogs.unidades.get"));
  }

  if (!current) {
    return dataFailure(notFoundError("No se encontro la unidad seleccionada."));
  }

  const { data, error } = await client
    .from("unidades_medida")
    .update(parsed.data as never)
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("id", unidadId)
    .select("*")
    .single();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "partida_catalogs.unidades.update"));
  }

  const auditResult = await insertActivityEvent(client, {
    action: "update",
    after: data,
    before: current,
    changedFields: getChangedFields(current, data),
    entityId: data.id,
    entityType: "unidad_medida",
    metadata: { repository: "partidaCatalogsRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data as unknown as UnidadMedida);
}
