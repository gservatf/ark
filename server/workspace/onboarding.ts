import { dataFailure, dataSuccess, normalizeSupabaseError, validationError } from "@/lib/data/errors";
import type { DataResult } from "@/lib/data/types";
import { createServerClient } from "@/lib/supabase/server";

export type ActiveWorkspaceStatus = {
  hasActiveWorkspace: boolean;
  membershipId: string | null;
  organizationId: string | null;
  userId: string;
};

export type WorkspaceOnboardingStatus = {
  needsOnboarding: boolean;
  workspace: ActiveWorkspaceStatus;
};

export type ActiveWorkspaceLookupInput = {
  userId: string;
};

export type WorkspaceRuntimeClient = {
  from(table: "organizacion_miembros"): WorkspaceMembershipQuery;
};

type WorkspaceMembershipQuery = {
  eq(column: string, value: string): WorkspaceMembershipQuery;
  limit(count: number): WorkspaceMembershipQuery;
  maybeSingle(): Promise<{ data: unknown; error: unknown }>;
  select(columns: string): WorkspaceMembershipQuery;
};

type ActiveMembershipRecord = {
  id: string;
  organizacion_id: string;
};

export async function hasActiveWorkspace(userId: string): Promise<DataResult<ActiveWorkspaceStatus>> {
  const supabase = createServerClient();

  return hasActiveWorkspaceWithClient(supabase, { userId });
}

export async function hasActiveWorkspaceWithClient(
  client: WorkspaceRuntimeClient,
  input: ActiveWorkspaceLookupInput
): Promise<DataResult<ActiveWorkspaceStatus>> {
  if (!input.userId) {
    return dataFailure(validationError("El usuario es obligatorio para consultar el workspace activo."));
  }

  const { data, error } = await client
    .from("organizacion_miembros")
    .select("id, organizacion_id")
    .eq("user_id", input.userId)
    .eq("estado", "activo")
    .limit(1)
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "workspace.activeMembership"));
  }

  const membership = data as ActiveMembershipRecord | null;

  return dataSuccess({
    hasActiveWorkspace: Boolean(membership),
    membershipId: membership?.id ?? null,
    organizationId: membership?.organizacion_id ?? null,
    userId: input.userId
  });
}

export async function hasVisibleActiveWorkspaceWithClient(
  client: WorkspaceRuntimeClient,
  userId: string
): Promise<DataResult<ActiveWorkspaceStatus>> {
  if (!userId) {
    return dataFailure(validationError("El usuario es obligatorio para consultar el workspace activo."));
  }

  const { data, error } = await client
    .from("organizacion_miembros")
    .select("id, organizacion_id")
    .eq("estado", "activo")
    .limit(1)
    .maybeSingle();

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "workspace.visibleActiveMembership"));
  }

  const membership = data as ActiveMembershipRecord | null;

  return dataSuccess({
    hasActiveWorkspace: Boolean(membership),
    membershipId: membership?.id ?? null,
    organizationId: membership?.organizacion_id ?? null,
    userId
  });
}

export async function needsOnboarding(userId: string): Promise<DataResult<WorkspaceOnboardingStatus>> {
  const workspaceResult = await hasActiveWorkspace(userId);

  if (!workspaceResult.ok) {
    return workspaceResult;
  }

  return dataSuccess({
    needsOnboarding: !workspaceResult.data.hasActiveWorkspace,
    workspace: workspaceResult.data
  });
}
