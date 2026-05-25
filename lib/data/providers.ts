import { proveedorInputSchema, type ProveedorInput } from "../validations/providers";
import type { Proveedor } from "../../types/domain";

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

export type ProviderUpdateInput = Partial<ProveedorInput>;

export async function listProviders(
  client: DataClient,
  scope: DataScope
): Promise<DataResult<Proveedor[]>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const { data, error } = await client
    .from("proveedores")
    .select("*")
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .order("nombre", { ascending: true });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "proveedores.list"));
  }

  return dataSuccess(data || []);
}

export async function getProviderById(
  client: DataClient,
  scope: DataScope,
  providerId: string
): Promise<DataResult<Proveedor>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  if (!providerId.trim()) {
    return dataFailure(notFoundError());
  }

  const { data, error } = await client
    .from("proveedores")
    .select("*")
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("id", providerId)
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "proveedores.getById"));
  }

  if (!data) {
    return dataFailure(notFoundError());
  }

  return dataSuccess(data);
}

export async function createProvider(
  client: DataClient,
  scope: DataScope,
  input: ProveedorInput
): Promise<DataResult<Proveedor>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const parsed = proveedorInputSchema.safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const { data, error } = await client
    .from("proveedores")
    .insert({
      ...parsed.data,
      organizacion_id: scopeResult.data.organizacionId
    })
    .select("*")
    .single();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "proveedores.create"));
  }

  const auditResult = await insertActivityEvent(client, {
    action: "create",
    after: data,
    before: null,
    changedFields: getChangedFields(null, data),
    entityId: data.id,
    entityType: "proveedor",
    metadata: { repository: "providersRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data);
}

export async function updateProvider(
  client: DataClient,
  scope: DataScope,
  providerId: string,
  input: ProviderUpdateInput,
  options: OptimisticMutationOptions<Proveedor, ProviderUpdateInput> = {}
): Promise<DataResult<Proveedor>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const parsed = proveedorInputSchema.partial().safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const currentResult = await getProviderById(client, scopeResult.data, providerId);

  if (!currentResult.ok) {
    return currentResult;
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(currentResult.data, options);
  const updateData = { ...parsed.data };

  if (!Object.prototype.hasOwnProperty.call(input, "disponible_para_cliente")) {
    delete updateData.disponible_para_cliente;
  }

  const { data, error } = await client
    .from("proveedores")
    .update(updateData)
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("id", providerId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "proveedores.update"));
  }

  if (!data) {
    return conflictFailureFromLatest<Proveedor, ProviderUpdateInput>(client, "proveedores", providerId, expectedUpdatedAt, {
      attempted: options.attempted || updateData,
      base: options.base || currentResult.data,
      entityLabel: "El proveedor",
      source: "proveedores.update"
    });
  }

  const auditResult = await insertActivityEvent(client, {
    action: "update",
    after: data,
    before: currentResult.data,
    changedFields: getChangedFields(currentResult.data, data),
    entityId: data.id,
    entityType: "proveedor",
    metadata: { repository: "providersRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data);
}

export async function deleteProvider(
  client: DataClient,
  scope: DataScope,
  providerId: string
): Promise<DataResult<Proveedor>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  if (!providerId.trim()) {
    return dataFailure(notFoundError());
  }

  const { data, error } = await client.rpc("delete_provider_for_current_user", {
    p_provider_id: providerId
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "proveedores.delete"));
  }

  return dataSuccess(data as Proveedor);
}

export async function activateProvider(
  client: DataClient,
  scope: DataScope,
  providerId: string,
  options: OptimisticMutationOptions<Proveedor, { estado: "activo" }> = {}
): Promise<DataResult<Proveedor>> {
  return setProviderStatus(client, scope, providerId, "activo", options);
}

export async function deactivateProvider(
  client: DataClient,
  scope: DataScope,
  providerId: string,
  options: OptimisticMutationOptions<Proveedor, { estado: "inactivo" }> = {}
): Promise<DataResult<Proveedor>> {
  return setProviderStatus(client, scope, providerId, "inactivo", options);
}

async function setProviderStatus(
  client: DataClient,
  scope: DataScope,
  providerId: string,
  estado: "activo" | "inactivo",
  options: OptimisticMutationOptions<Proveedor, { estado: "activo" | "inactivo" }> = {}
): Promise<DataResult<Proveedor>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const currentResult = await getProviderById(client, scopeResult.data, providerId);

  if (!currentResult.ok) {
    return currentResult;
  }

  const expectedUpdatedAt = getExpectedUpdatedAt(currentResult.data, options);
  const { data, error } = await client
    .from("proveedores")
    .update({ estado })
    .eq("organizacion_id", scopeResult.data.organizacionId)
    .eq("id", providerId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "proveedores.deactivate"));
  }

  if (!data) {
    return conflictFailureFromLatest<Proveedor, { estado: "activo" | "inactivo" }>(client, "proveedores", providerId, expectedUpdatedAt, {
      attempted: options.attempted || { estado },
      base: options.base || currentResult.data,
      entityLabel: "El proveedor",
      source: "proveedores.status"
    });
  }

  const auditResult = await insertActivityEvent(client, {
    action: estado === "activo" ? "activate" : "deactivate",
    after: data,
    before: currentResult.data,
    changedFields: getChangedFields(currentResult.data, data),
    entityId: providerId,
    entityType: "proveedor",
    metadata: { repository: "providersRepository" },
    scope: scopeResult.data
  });

  if (!auditResult.ok) {
    return auditResult;
  }

  return dataSuccess(data);
}

export const providersRepository = {
  activateProvider,
  createProvider,
  deactivateProvider,
  deleteProvider,
  getProviderById,
  listProviders,
  updateProvider
};
