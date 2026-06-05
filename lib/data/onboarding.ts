import { dataFailure, dataSuccess, normalizeSupabaseError } from "./errors";
import type { DataClient, DataResult } from "./types";

export type OnboardingInput = {
  apellido: string;
  nombre: string;
};

export type OnboardingStatus = {
  hasPersonalOrganization: boolean;
};

export type CompleteOnboardingResult = {
  organizacionId: string;
  organizacionMiembroId: string;
  perfilUserId: string;
};

type WorkspaceOrganizationRecord = {
  tipoOrganizacion?: string;
};

type CompleteOnboardingRecord = {
  organizacion_id?: string;
  organizacion_miembro_id?: string;
  perfil_user_id?: string;
};

export async function getOnboardingStatus(client: DataClient): Promise<DataResult<OnboardingStatus>> {
  const { data, error } = await client.rpc("list_workspace_organizations");

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "onboarding.statusRpc"));
  }

  const organizations = (data || []) as unknown as WorkspaceOrganizationRecord[];

  return dataSuccess({
    hasPersonalOrganization: organizations.some((organization) => organization.tipoOrganizacion === "personal")
  });
}

export async function completeUserOnboarding(
  client: DataClient,
  input: OnboardingInput
): Promise<DataResult<CompleteOnboardingResult>> {
  const { data, error } = await client.rpc("complete_user_onboarding", {
    apellido_usuario: input.apellido,
    nombre_usuario: input.nombre
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "onboarding.completeRpc"));
  }

  const result = normalizeCompleteOnboardingResult(data);

  return dataSuccess(result);
}

function normalizeCompleteOnboardingResult(data: unknown): CompleteOnboardingResult {
  const record = (Array.isArray(data) ? data[0] : data) as CompleteOnboardingRecord | null | undefined;

  return {
    organizacionId: record?.organizacion_id || "",
    organizacionMiembroId: record?.organizacion_miembro_id || "",
    perfilUserId: record?.perfil_user_id || ""
  };
}
