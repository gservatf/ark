import type { Proyecto } from "@/types/domain";

import { projectInputSchema, type ProjectInput } from "../validations/projects";

import {
  dataFailure,
  dataSuccess,
  normalizeSupabaseError,
  normalizeValidationError
} from "./errors";
import { validateDataScope } from "./scope";
import type { DataClient, DataResult, DataScope } from "./types";
import { clearWorkspaceCache, resolveProjectWorkspace } from "./workspace";

export async function listWorkspaceProjects(
  client: DataClient,
  requestedProjectId?: string
): Promise<DataResult<Proyecto[]>> {
  const workspaceResult = await resolveProjectWorkspace(client, requestedProjectId);

  if (!workspaceResult.ok) {
    return workspaceResult;
  }

  return dataSuccess(workspaceResult.data.projects);
}

export async function createProject(
  client: DataClient,
  scope: DataScope,
  input: ProjectInput
): Promise<DataResult<Proyecto>> {
  const scopeResult = validateDataScope(scope, { requireActor: true });

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const parsed = projectInputSchema.safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const { data, error } = await client.rpc("create_project_in_organization", {
    cliente: parsed.data.cliente || undefined,
    nombre_proyecto: parsed.data.nombre,
    p_organizacion_id: scopeResult.data.organizacionId,
    ubicacion: parsed.data.ubicacion || undefined
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "proyectos.createRpc"));
  }

  const project = Array.isArray(data) ? data[0] : data;

  if (!project) {
    return dataFailure(normalizeSupabaseError({ message: "No se devolvio el proyecto creado." }, "proyectos.createRpc"));
  }

  clearWorkspaceCache(client);

  return dataSuccess(project as Proyecto);
}

export const projectsRepository = {
  createProject,
  listWorkspaceProjects
};
