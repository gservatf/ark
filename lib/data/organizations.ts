import { z } from "zod";

import {
  dataFailure,
  dataSuccess,
  normalizeSupabaseError,
  normalizeValidationError
} from "./errors";
import type { DataClient, DataResult } from "./types";
import { clearWorkspaceCache } from "./workspace";

export type OrganizationInvitation = {
  createdAt: string;
  email: string;
  estado: "pendiente" | "aceptada" | "rechazada" | "revocada" | "expirada";
  expiresAt: string;
  id: string;
  incluirProyectosFuturos?: boolean;
  organizacionId: string;
  organizacionNombre?: string;
  organizacionTipo?: "personal" | "empresa";
  proyectoId: string | null;
  proyectoIds?: string[];
  proyectoNombre: string | null;
  proyectoNombres?: string[];
  rolOrganizacion: "admin" | "miembro" | "owner";
  rolProyecto: ProjectAccessRole | null;
  updatedAt?: string;
};

export type ProjectAccessRole = "admin" | "editor" | "lector";

export type OrganizationMemberProjectAccess = {
  cliente: string | null;
  effectiveRole: ProjectAccessRole | null;
  estado: "activo" | "invitado" | "suspendido" | null;
  explicitRole: ProjectAccessRole | null;
  hasExplicitAccess: boolean;
  isInherited: boolean;
  projectId: string;
  projectName: string;
  ubicacion: string | null;
};

export type OrganizationMemberPermissions = {
  accesoTodosProyectos: boolean;
  createdAt: string;
  displayName: string;
  email: string | null;
  estado: "activo" | "invitado" | "suspendido";
  id: string;
  joinedAt: string | null;
  projects: OrganizationMemberProjectAccess[];
  rolOrganizacion: "admin" | "miembro" | "owner";
  rolProyectoPredeterminado: ProjectAccessRole | null;
  updatedAt: string;
  userId: string;
};

export type UpdateOrganizationMemberPermissionsInput = {
  accesoTodosProyectos: boolean;
  memberId: string;
  organizacionId: string;
  projectAccess: Array<{ projectId: string; rol: ProjectAccessRole }>;
  rolOrganizacion: "admin" | "miembro";
  rolProyectoPredeterminado?: ProjectAccessRole | null;
};

export type InvitationLinkResult = {
  email: string;
  expiresAt: string;
  invitacionId: string;
  organizacionId: string;
  token: string;
};

export type OrganizationInput = {
  nombre: string;
  ruc?: string | null;
};

export type InvitationInput = {
  email: string;
  incluirProyectosFuturos?: boolean;
  organizacionId: string;
  proyectoIds?: string[];
  rolOrganizacion: "admin" | "miembro";
  rolProyecto?: ProjectAccessRole | null;
};

const organizationSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre de la organizacion es obligatorio."),
  ruc: z
    .string()
    .trim()
    .regex(/^[0-9]{11}$/, "El RUC debe tener 11 digitos.")
    .optional()
    .or(z.literal(""))
    .nullable()
});

const invitationSchema = z.object({
  email: z.string().trim().email("Ingresa un correo valido.").toLowerCase(),
  incluirProyectosFuturos: z.boolean().optional(),
  organizacionId: z.string().uuid("Selecciona una organizacion valida."),
  proyectoIds: z.array(z.string().uuid("Selecciona un proyecto valido.")).default([]),
  rolOrganizacion: z.enum(["admin", "miembro"]),
  rolProyecto: z.enum(["admin", "editor", "lector"]).optional().nullable()
});

export async function createOrganization(
  client: DataClient,
  input: OrganizationInput
): Promise<DataResult<{ id: string; nombre: string }>> {
  const parsed = organizationSchema.safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const { data, error } = await client.rpc("create_organization_for_current_user", {
    nombre_org: parsed.data.nombre,
    ruc_org: parsed.data.ruc || undefined
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "organizaciones.createRpc"));
  }

  clearWorkspaceCache(client);
  return dataSuccess(data as { id: string; nombre: string });
}

export async function createOrganizationInvitation(
  client: DataClient,
  input: InvitationInput
): Promise<DataResult<InvitationLinkResult>> {
  const parsed = invitationSchema.safeParse(input);

  if (!parsed.success) {
    return dataFailure(normalizeValidationError(parsed.error));
  }

  const { data, error } = await client.rpc("create_organization_invitation", {
    p_email: parsed.data.email,
    p_incluir_proyectos_futuros: parsed.data.incluirProyectosFuturos || false,
    p_organizacion_id: parsed.data.organizacionId,
    p_proyecto_ids: parsed.data.proyectoIds,
    p_rol_organizacion: parsed.data.rolOrganizacion,
    p_rol_proyecto:
      parsed.data.proyectoIds.length > 0 || parsed.data.incluirProyectosFuturos
        ? parsed.data.rolProyecto || "editor"
        : undefined
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "organizaciones.inviteRpc"));
  }

  return dataSuccess(normalizeInvitationLinkResult(data));
}

export async function regenerateOrganizationInvitationToken(
  client: DataClient,
  invitationId: string
): Promise<DataResult<InvitationLinkResult>> {
  const { data, error } = await client.rpc("regenerate_organization_invitation_token", {
    p_invitacion_id: invitationId
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "organizaciones.regenerateInviteRpc"));
  }

  return dataSuccess(normalizeInvitationLinkResult(data));
}

export async function listSentOrganizationInvitations(
  client: DataClient,
  organizationId: string
): Promise<DataResult<OrganizationInvitation[]>> {
  const { data, error } = await client.rpc("list_sent_organization_invitations", {
    p_organizacion_id: organizationId
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "organizaciones.sentInvitesRpc"));
  }

  return dataSuccess((data || []) as unknown as OrganizationInvitation[]);
}

export async function listReceivedOrganizationInvitations(
  client: DataClient
): Promise<DataResult<OrganizationInvitation[]>> {
  const { data, error } = await client.rpc("list_received_organization_invitations");

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "organizaciones.receivedInvitesRpc"));
  }

  return dataSuccess((data || []) as unknown as OrganizationInvitation[]);
}

export async function listOrganizationInvitationNotifications(
  client: DataClient,
  organizationId: string
): Promise<DataResult<OrganizationInvitation[]>> {
  const { data, error } = await client.rpc("list_organization_invitation_notifications", {
    p_organizacion_id: organizationId
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "organizaciones.inviteNotificationsRpc"));
  }

  return dataSuccess((data || []) as unknown as OrganizationInvitation[]);
}

export async function listOrganizationMemberPermissions(
  client: DataClient,
  organizationId: string
): Promise<DataResult<OrganizationMemberPermissions[]>> {
  const { data, error } = await client.rpc("list_organization_member_permissions", {
    p_organizacion_id: organizationId
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "organizaciones.memberPermissionsRpc"));
  }

  return dataSuccess((data || []) as unknown as OrganizationMemberPermissions[]);
}

export async function updateOrganizationMemberPermissions(
  client: DataClient,
  input: UpdateOrganizationMemberPermissionsInput
): Promise<DataResult<OrganizationMemberPermissions[]>> {
  const { data, error } = await client.rpc("update_organization_member_permissions", {
    p_acceso_todos_proyectos: input.accesoTodosProyectos,
    p_organizacion_id: input.organizacionId,
    p_organizacion_miembro_id: input.memberId,
    p_project_access: input.projectAccess,
    p_rol_organizacion: input.rolOrganizacion,
    p_rol_proyecto_predeterminado: input.accesoTodosProyectos
      ? input.rolProyectoPredeterminado || "lector"
      : undefined
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "organizaciones.updateMemberPermissionsRpc"));
  }

  clearWorkspaceCache(client);
  return dataSuccess((data || []) as unknown as OrganizationMemberPermissions[]);
}

export async function acceptOrganizationInvitation(
  client: DataClient,
  token: string
): Promise<DataResult<{ invitacion_id: string; organizacion_id: string; proyecto_id: string | null }>> {
  const { data, error } = await client.rpc("accept_organization_invitation", { p_token: token });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "organizaciones.acceptInviteRpc"));
  }

  clearWorkspaceCache(client);
  const result = Array.isArray(data) ? data[0] : data;
  return dataSuccess(result);
}

export async function acceptOrganizationInvitationById(
  client: DataClient,
  invitationId: string
): Promise<DataResult<{ invitacion_id: string; organizacion_id: string; proyecto_id: string | null }>> {
  const { data, error } = await client.rpc("accept_organization_invitation_by_id", {
    p_invitacion_id: invitationId
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "organizaciones.acceptInviteByIdRpc"));
  }

  clearWorkspaceCache(client);
  const result = Array.isArray(data) ? data[0] : data;
  return dataSuccess(result);
}

export async function rejectOrganizationInvitation(
  client: DataClient,
  invitationId: string
): Promise<DataResult<OrganizationInvitation>> {
  const { data, error } = await client.rpc("reject_organization_invitation", {
    p_invitacion_id: invitationId
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "organizaciones.rejectInviteRpc"));
  }

  return dataSuccess(data as unknown as OrganizationInvitation);
}

export async function revokeOrganizationInvitation(
  client: DataClient,
  invitationId: string
): Promise<DataResult<OrganizationInvitation>> {
  const { data, error } = await client.rpc("revoke_organization_invitation", {
    p_invitacion_id: invitationId
  });

  if (error) {
    return dataFailure(normalizeSupabaseError(error, "organizaciones.revokeInviteRpc"));
  }

  return dataSuccess(data as unknown as OrganizationInvitation);
}

function normalizeInvitationLinkResult(data: unknown): InvitationLinkResult {
  const item = Array.isArray(data) ? data[0] : data;
  const record = item as {
    email: string;
    expires_at: string;
    invitacion_id: string;
    organizacion_id: string;
    token: string;
  };

  return {
    email: record.email,
    expiresAt: record.expires_at,
    invitacionId: record.invitacion_id,
    organizacionId: record.organizacion_id,
    token: record.token
  };
}
