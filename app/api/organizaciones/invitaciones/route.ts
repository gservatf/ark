import { NextResponse } from "next/server";

import {
  createOrganizationInvitation,
  regenerateOrganizationInvitationToken,
  type InvitationInput
} from "@/lib/data/organizations";
import { buildInvitationEmail, sendProductEmail } from "@/lib/email/resend";
import { createServerClient } from "@/lib/supabase/server";

type InvitationRequest =
  | (InvitationInput & { action?: "create"; organizationName?: string })
  | { action: "regenerate"; invitationId: string; organizationName?: string };

type EmailStatus = "sent" | "skipped" | "failed";

export async function POST(request: Request) {
  const supabase = createServerClient();
  const body = (await request.json().catch(() => null)) as InvitationRequest | null;

  if (!body) {
    return NextResponse.json({ error: "Solicitud invalida." }, { status: 400 });
  }

  if (body.action === "regenerate") {
    const result = await regenerateOrganizationInvitationToken(supabase, body.invitationId);

    if (!result.ok) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    const acceptUrl = buildInvitationUrl(result.data.token);
    const emailStatus = await sendInvitationEmail({
      acceptUrl,
      email: result.data.email,
      organizationName: body.organizationName
    });

    return NextResponse.json({
      acceptUrl,
      acceptUrls: [acceptUrl],
      createdCount: 1,
      emailStatus,
      invitation: result.data,
      invitations: [result.data]
    });
  }

  const emails = parseInvitationEmails(body.email);

  if (emails.length === 0) {
    return NextResponse.json({ error: "Ingresa al menos un correo valido." }, { status: 400 });
  }

  const invitations = [];
  const acceptUrls: string[] = [];
  const emailStatuses: EmailStatus[] = [];

  for (const email of emails) {
    const result = await createOrganizationInvitation(supabase, { ...body, email });

    if (!result.ok) {
      return NextResponse.json({ error: `${email}: ${result.error.message}` }, { status: 400 });
    }

    const acceptUrl = buildInvitationUrl(result.data.token);
    invitations.push(result.data);
    acceptUrls.push(acceptUrl);
    emailStatuses.push(
      await sendInvitationEmail({
        acceptUrl,
        email: result.data.email,
        organizationName: body.organizationName
      })
    );
  }

  return NextResponse.json({
    acceptUrl: acceptUrls[0],
    acceptUrls,
    createdCount: invitations.length,
    emailStatus: summarizeEmailStatus(emailStatuses),
    invitation: invitations[0],
    invitations
  });
}

function buildInvitationUrl(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://127.0.0.1:3000";
  const url = new URL("/configuracion/organizaciones", baseUrl);
  url.searchParams.set("invite", token);
  return url.toString();
}

async function sendInvitationEmail({
  acceptUrl,
  email,
  organizationName
}: {
  acceptUrl: string;
  email: string;
  organizationName?: string;
}): Promise<EmailStatus> {
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

function parseInvitationEmails(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function summarizeEmailStatus(statuses: EmailStatus[]): EmailStatus | "mixed" {
  const unique = new Set(statuses);

  if (unique.size === 1) {
    return statuses[0] || "skipped";
  }

  return "mixed";
}
