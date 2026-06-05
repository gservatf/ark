import { NextResponse } from "next/server";

import {
  createOrganizationInvitations,
  regenerateOrganizationInvitation,
  type OrganizationInvitationRequest
} from "@/server/organizations/invitations";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as OrganizationInvitationRequest | null;

  if (!body) {
    return NextResponse.json({ error: "Solicitud invalida." }, { status: 400 });
  }

  if (body.action === "regenerate") {
    const result = await regenerateOrganizationInvitation({
      invitationId: body.invitationId,
      organizationName: body.organizationName
    });

    if (!result.ok) {
      return NextResponse.json(result.error, { status: 400 });
    }

    return NextResponse.json(result.data);
  }

  const result = await createOrganizationInvitations(body);

  if (!result.ok) {
    return NextResponse.json(result.error, { status: 400 });
  }

  return NextResponse.json(result.data);
}
