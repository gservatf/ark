import {
  createOrganizationInvitation,
  regenerateOrganizationInvitationToken,
  type InvitationInput,
  type InvitationLinkResult
} from "@/lib/data/organizations";
import { buildInvitationEmail, sendProductEmail } from "@/lib/email/resend";
import { createServerClient } from "@/lib/supabase/server";

export type OrganizationInvitationRequest =
  | (InvitationInput & { action?: "create"; organizationName?: string })
  | { action: "regenerate"; invitationId: string; organizationName?: string };

export type InvitationEmailStatus = "sent" | "skipped" | "failed";

export type InvitationActionResult = {
  acceptUrl: string;
  acceptUrls: string[];
  createdCount: number;
  emailStatus: InvitationEmailStatus | "mixed";
  invitation: InvitationLinkResult;
  invitations: InvitationLinkResult[];
};

export type InvitationActionFailure = {
  error: string;
};

export type InvitationActionResponse =
  | { data: InvitationActionResult; ok: true }
  | { error: InvitationActionFailure; ok: false };

export async function createOrganizationInvitations(
  input: InvitationInput & { organizationName?: string }
): Promise<InvitationActionResponse> {
  const emails = parseInvitationEmails(input.email);

  if (emails.length === 0) {
    return invitationFailure("Ingresa al menos un correo valido.");
  }

  const supabase = createServerClient();
  const invitations: InvitationLinkResult[] = [];
  const acceptUrls: string[] = [];
  const emailStatuses: InvitationEmailStatus[] = [];

  for (const email of emails) {
    const result = await createOrganizationInvitation(supabase, { ...input, email });

    if (!result.ok) {
      return invitationFailure(`${email}: ${result.error.message}`);
    }

    const acceptUrl = buildInvitationUrl(result.data.token);
    invitations.push(result.data);
    acceptUrls.push(acceptUrl);
    emailStatuses.push(
      await sendInvitationEmail({
        acceptUrl,
        email: result.data.email,
        organizationName: input.organizationName
      })
    );
  }

  return invitationSuccess({
    acceptUrl: acceptUrls[0],
    acceptUrls,
    createdCount: invitations.length,
    emailStatus: summarizeEmailStatus(emailStatuses),
    invitation: invitations[0],
    invitations
  });
}

export async function regenerateOrganizationInvitation(input: {
  invitationId: string;
  organizationName?: string;
}): Promise<InvitationActionResponse> {
  const supabase = createServerClient();
  const result = await regenerateOrganizationInvitationToken(supabase, input.invitationId);

  if (!result.ok) {
    return invitationFailure(result.error.message);
  }

  const acceptUrl = buildInvitationUrl(result.data.token);
  const emailStatus = await sendInvitationEmail({
    acceptUrl,
    email: result.data.email,
    organizationName: input.organizationName
  });

  return invitationSuccess({
    acceptUrl,
    acceptUrls: [acceptUrl],
    createdCount: 1,
    emailStatus,
    invitation: result.data,
    invitations: [result.data]
  });
}

export function buildInvitationUrl(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://127.0.0.1:3000";
  const url = new URL("/configuracion/organizaciones", baseUrl);
  url.searchParams.set("invite", token);
  return url.toString();
}

export async function sendInvitationEmail({
  acceptUrl,
  email,
  organizationName
}: {
  acceptUrl: string;
  email: string;
  organizationName?: string;
}): Promise<InvitationEmailStatus> {
  try {
    const message = buildInvitationEmail({
      acceptUrl,
      organizationName: organizationName || "tu organizacion"
    });
    const sent = await sendProductEmail({
      ...message,
      to: email
    });
    return sent.skipped ? "skipped" : "sent";
  } catch {
    return "failed";
  }
}

export function parseInvitationEmails(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export function summarizeEmailStatus(statuses: InvitationEmailStatus[]): InvitationEmailStatus | "mixed" {
  const unique = new Set(statuses);

  if (unique.size === 1) {
    return statuses[0] || "skipped";
  }

  return "mixed";
}

function invitationSuccess(data: InvitationActionResult): InvitationActionResponse {
  return { data, ok: true };
}

function invitationFailure(message: string): InvitationActionResponse {
  return {
    error: { error: message },
    ok: false
  };
}
