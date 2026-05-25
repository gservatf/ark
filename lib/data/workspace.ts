import type { Proyecto } from "@/types/domain";

import { dataFailure, dataSuccess, normalizeSupabaseError, notFoundError } from "./errors";
import type { DataClient, DataResult, DataScope } from "./types";

export const activeOrganizationStorageKey = "cyp.activeOrganizationId";
export const activeProjectStorageKey = "cyp.activeProjectId";

export type OrganizationSummary = {
  accesoTodosProyectos?: boolean;
  canMutate: boolean;
  id: string;
  membershipId: string;
  nombre: string;
  projects: Proyecto[];
  rol: string;
  rolProyectoPredeterminado?: string | null;
  ruc: string | null;
  tipoOrganizacion: "personal" | "empresa";
};

export type OrganizationWorkspace = {
  activeOrganization: OrganizationSummary;
  canMutate: boolean;
  membershipId: string;
  organizationRole: string;
  organizations: OrganizationSummary[];
  scope: DataScope;
};

export type ProjectWorkspace = OrganizationWorkspace & {
  canEmit: boolean;
  projectRole?: string;
  projects: Proyecto[];
};

const organizationWorkspaceCache = new WeakMap<DataClient, Map<string, Promise<DataResult<OrganizationWorkspace>>>>();
const projectWorkspaceCache = new WeakMap<DataClient, Map<string, Promise<DataResult<ProjectWorkspace>>>>();

export async function resolveOrganizationWorkspace(
  client: DataClient,
  organizationId?: string
): Promise<DataResult<OrganizationWorkspace>> {
  if (canUseWorkspaceCache()) {
    const cacheKey = organizationId || getStoredActiveOrganizationId() || "__first__";
    let clientCache = organizationWorkspaceCache.get(client);

    if (!clientCache) {
      clientCache = new Map();
      organizationWorkspaceCache.set(client, clientCache);
    }

    const cached = clientCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const pending = resolveOrganizationWorkspaceUncached(client, organizationId).then((result) => {
      if (!result.ok) {
        clientCache?.delete(cacheKey);
      }

      return result;
    });
    clientCache.set(cacheKey, pending);

    return pending;
  }

  return resolveOrganizationWorkspaceUncached(client, organizationId);
}

export async function resolveProjectWorkspace(
  client: DataClient,
  requestedProjectId?: string,
  organizationId?: string
): Promise<DataResult<ProjectWorkspace>> {
  if (canUseWorkspaceCache()) {
    const cacheKey = `${organizationId || getStoredActiveOrganizationId() || "__first__"}:${
      requestedProjectId || getStoredActiveProjectId() || "__first__"
    }`;
    let clientCache = projectWorkspaceCache.get(client);

    if (!clientCache) {
      clientCache = new Map();
      projectWorkspaceCache.set(client, clientCache);
    }

    const cached = clientCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const pending = resolveProjectWorkspaceUncached(client, requestedProjectId, organizationId).then((result) => {
      if (!result.ok) {
        clientCache?.delete(cacheKey);
      }

      return result;
    });
    clientCache.set(cacheKey, pending);

    return pending;
  }

  return resolveProjectWorkspaceUncached(client, requestedProjectId, organizationId);
}

export function clearWorkspaceCache(client?: DataClient) {
  if (client) {
    organizationWorkspaceCache.delete(client);
    projectWorkspaceCache.delete(client);
    return;
  }

  // WeakMap no permite clear(); en la practica se invalida por cliente singleton.
}

export async function listWorkspaceOrganizations(
  client: DataClient
): Promise<DataResult<OrganizationSummary[]>> {
  const { data, error } = await client.rpc("list_workspace_organizations");

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "organizaciones.listWorkspace"));
  }

  return dataSuccess(((data || []) as unknown as OrganizationSummary[]).map(normalizeOrganizationSummary));
}

export function canManageOrganizationCatalog(workspace: OrganizationWorkspace) {
  return (
    workspace.canMutate ||
    workspace.activeOrganization.projects.some((project) => getProjectRole(project) === "admin")
  );
}

export function getStoredActiveOrganizationId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(activeOrganizationStorageKey);
}

export function setStoredActiveOrganizationId(organizationId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(activeOrganizationStorageKey, organizationId);
}

export function getStoredActiveProjectId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(activeProjectStorageKey);
}

export function setStoredActiveProjectId(projectId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(activeProjectStorageKey, projectId);
}

export function clearStoredActiveProjectId() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(activeProjectStorageKey);
}

export function clearStoredActiveOrganizationId() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(activeOrganizationStorageKey);
}

async function resolveOrganizationWorkspaceUncached(
  client: DataClient,
  organizationId?: string
): Promise<DataResult<OrganizationWorkspace>> {
  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError || !user) {
    return dataFailure(notFoundError("Debes iniciar sesion para consultar este modulo."));
  }

  const organizationsResult = await listWorkspaceOrganizations(client);

  if (!organizationsResult.ok) {
    return organizationsResult;
  }

  const organizations = organizationsResult.data;

  if (organizations.length === 0) {
    return dataFailure(notFoundError("No se encontro una organizacion activa para esta cuenta."));
  }

  const requestedOrganizationId = organizationId || getStoredActiveOrganizationId();
  const selectedOrganization =
    organizations.find((organization) => organization.id === requestedOrganizationId) || organizations[0];

  if (requestedOrganizationId && selectedOrganization.id !== requestedOrganizationId) {
    clearStoredActiveOrganizationId();
  }

  return dataSuccess({
    activeOrganization: selectedOrganization,
    canMutate: selectedOrganization.canMutate,
    membershipId: selectedOrganization.membershipId,
    organizationRole: selectedOrganization.rol,
    organizations,
    scope: {
      actorId: user.id,
      organizacionId: selectedOrganization.id
    }
  });
}

async function resolveProjectWorkspaceUncached(
  client: DataClient,
  requestedProjectId?: string,
  organizationId?: string
): Promise<DataResult<ProjectWorkspace>> {
  const organizationResult = await resolveOrganizationWorkspace(client, organizationId);

  if (!organizationResult.ok) {
    return organizationResult;
  }

  const organizationByRequestedProject = requestedProjectId
    ? organizationResult.data.organizations.find((organization) =>
        organization.projects.some((project) => project.id === requestedProjectId)
      )
    : undefined;
  const selectedOrganization = organizationByRequestedProject || organizationResult.data.activeOrganization;
  const projects = selectedOrganization.projects;
  const storedProjectId = getStoredActiveProjectId();
  const selectedProject =
    projects.find((project) => project.id === requestedProjectId) ||
    projects.find((project) => project.id === storedProjectId) ||
    projects[0] ||
    null;
  const selectedProjectRole = getProjectRole(selectedProject);

  if (organizationByRequestedProject) {
    setStoredActiveOrganizationId(selectedOrganization.id);
  }

  if (selectedProject) {
    setStoredActiveProjectId(selectedProject.id);
  } else if (storedProjectId) {
    clearStoredActiveProjectId();
  }

  return dataSuccess({
    ...organizationResult.data,
    activeOrganization: selectedOrganization,
    canEmit:
      selectedOrganization.canMutate ||
      selectedProjectRole === "admin" ||
      selectedProjectRole === "presupuestador",
    canMutate:
      selectedOrganization.canMutate ||
      ["admin", "presupuestador", "editor"].includes(selectedProjectRole || ""),
    membershipId: selectedOrganization.membershipId,
    organizationRole: selectedOrganization.rol,
    projectRole: selectedProjectRole,
    projects,
    scope: {
      actorId: organizationResult.data.scope.actorId,
      organizacionId: selectedOrganization.id,
      proyectoId: selectedProject?.id
    }
  });
}

function canUseWorkspaceCache() {
  return typeof window !== "undefined";
}

function normalizeOrganizationSummary(organization: OrganizationSummary): OrganizationSummary {
  return {
    ...organization,
    projects: organization.projects || []
  };
}

function getProjectRole(project: Proyecto | null) {
  return (project as (Proyecto & { rol?: string }) | null)?.rol;
}
