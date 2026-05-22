import type { Proyecto } from "@/types/domain";

import { dataFailure, dataSuccess, normalizeSupabaseError, notFoundError } from "./errors";
import type { DataClient, DataResult, DataScope } from "./types";

export type OrganizationWorkspace = {
  canMutate: boolean;
  membershipId: string;
  organizationRole: string;
  scope: DataScope;
};

export type ProjectWorkspace = OrganizationWorkspace & {
  canEmit: boolean;
  projectRole: string;
  projects: Proyecto[];
};

type ProjectMembershipRow = {
  proyecto: Proyecto | null;
  proyecto_id: string;
  rol: string;
};

const organizationWorkspaceCache = new WeakMap<DataClient, Promise<DataResult<OrganizationWorkspace>>>();
const projectWorkspaceCache = new WeakMap<DataClient, Map<string, Promise<DataResult<ProjectWorkspace>>>>();

export async function resolveOrganizationWorkspace(
  client: DataClient
): Promise<DataResult<OrganizationWorkspace>> {
  if (canUseWorkspaceCache()) {
    const cached = organizationWorkspaceCache.get(client);

    if (cached) {
      return cached;
    }

    const pending = resolveOrganizationWorkspaceUncached(client).then((result) => {
      if (!result.ok) {
        organizationWorkspaceCache.delete(client);
      }

      return result;
    });
    organizationWorkspaceCache.set(client, pending);

    return pending;
  }

  return resolveOrganizationWorkspaceUncached(client);
}

export async function resolveProjectWorkspace(
  client: DataClient,
  requestedProjectId?: string
): Promise<DataResult<ProjectWorkspace>> {
  if (canUseWorkspaceCache()) {
    const cacheKey = requestedProjectId || "__first__";
    let clientCache = projectWorkspaceCache.get(client);

    if (!clientCache) {
      clientCache = new Map();
      projectWorkspaceCache.set(client, clientCache);
    }

    const cached = clientCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const pending = resolveProjectWorkspaceUncached(client, requestedProjectId).then((result) => {
      if (!result.ok) {
        clientCache?.delete(cacheKey);
      }

      return result;
    });
    clientCache.set(cacheKey, pending);

    return pending;
  }

  return resolveProjectWorkspaceUncached(client, requestedProjectId);
}

export function clearWorkspaceCache(client?: DataClient) {
  if (client) {
    organizationWorkspaceCache.delete(client);
    projectWorkspaceCache.delete(client);
    return;
  }

  // WeakMap no permite clear(); en la practica se invalida por cliente singleton.
}

async function resolveOrganizationWorkspaceUncached(
  client: DataClient
): Promise<DataResult<OrganizationWorkspace>> {
  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError || !user) {
    return dataFailure(notFoundError("Debes iniciar sesión para consultar este módulo."));
  }

  const { data: membership, error: membershipError } = await client
    .from("organizacion_miembros")
    .select("id, organizacion_id, rol")
    .eq("estado", "activo")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    return dataFailure(normalizeSupabaseError(membershipError, "organizacion_miembros.resolveWorkspace"));
  }

  if (!membership) {
    return dataFailure(notFoundError("No se encontró una organización activa para esta cuenta."));
  }

  return dataSuccess({
    canMutate: membership.rol === "owner" || membership.rol === "admin",
    membershipId: membership.id,
    organizationRole: membership.rol,
    scope: {
      actorId: user.id,
      organizacionId: membership.organizacion_id
    }
  });
}

async function resolveProjectWorkspaceUncached(
  client: DataClient,
  requestedProjectId?: string
): Promise<DataResult<ProjectWorkspace>> {
  const organizationResult = await resolveOrganizationWorkspace(client);

  if (!organizationResult.ok) {
    return organizationResult;
  }

  const { data: projectMemberships, error: projectMembershipError } = await client
    .from("proyecto_miembros")
    .select("rol, proyecto_id, proyecto:proyectos(*)")
    .eq("organizacion_miembro_id", organizationResult.data.membershipId)
    .eq("estado", "activo")
    .order("created_at", { ascending: true })
    .returns<ProjectMembershipRow[]>();

  if (projectMembershipError) {
    return dataFailure(normalizeSupabaseError(projectMembershipError, "proyecto_miembros.resolveWorkspace"));
  }

  if (!projectMemberships || projectMemberships.length === 0) {
    return dataFailure(notFoundError("No se encontró un proyecto activo para esta cuenta."));
  }

  const selectedMembership =
    projectMemberships.find((item) => item.proyecto_id === requestedProjectId) || projectMemberships[0];
  const projects = projectMemberships
    .map((item) => item.proyecto)
    .filter((project): project is Proyecto => Boolean(project));

  return dataSuccess({
    ...organizationResult.data,
    canEmit:
      organizationResult.data.organizationRole === "owner" ||
      organizationResult.data.organizationRole === "admin" ||
      selectedMembership.rol === "admin" ||
      selectedMembership.rol === "presupuestador",
    canMutate:
      organizationResult.data.canMutate ||
      ["admin", "presupuestador", "editor"].includes(selectedMembership.rol),
    projectRole: selectedMembership.rol,
    projects,
    scope: {
      ...organizationResult.data.scope,
      proyectoId: selectedMembership.proyecto_id
    }
  });
}

function canUseWorkspaceCache() {
  return typeof window !== "undefined";
}
