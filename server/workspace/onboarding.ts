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

type ActiveMembershipRecord = {
  id: string;
  organizacion_id: string;
};

export async function hasActiveWorkspace(userId: string): Promise<DataResult<ActiveWorkspaceStatus>> {
  if (!userId) {
    return dataFailure(validationError("El usuario es obligatorio para consultar el workspace activo."));
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("organizacion_miembros")
    .select("id, organizacion_id")
    .eq("user_id", userId)
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
