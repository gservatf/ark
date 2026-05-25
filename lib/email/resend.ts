type ResendEmailInput = {
  html: string;
  subject: string;
  text: string;
  to: string;
};

const resendApiUrl = "https://api.resend.com/emails";
const invitationFrom = "C y P <notificaciones@polacklabs.com>";

export function canSendProductEmail() {
  return Boolean(getResendApiKey());
}

export async function sendProductEmail(input: ResendEmailInput): Promise<{ id?: string; skipped: boolean }> {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    return { skipped: true };
  }

  const response = await fetch(resendApiUrl, {
    body: JSON.stringify({
      from: invitationFrom,
      html: input.html,
      subject: input.subject,
      text: input.text,
      to: input.to
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(details || "No se pudo enviar el correo de invitacion.");
  }

  const data = (await response.json().catch(() => null)) as { id?: string } | null;
  return { id: data?.id, skipped: false };
}

export function buildInvitationEmail({
  acceptUrl,
  organizationName
}: {
  acceptUrl: string;
  organizationName: string;
}) {
  const subject = `Invitacion a ${organizationName} en C y P`;
  const text = [
    `Te invitaron a colaborar en ${organizationName} dentro de C y P.`,
    `Acepta la invitacion desde este enlace: ${acceptUrl}`,
    "El enlace vence en 14 dias."
  ].join("\n\n");
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 560px;">
      <h1 style="font-size: 22px; margin: 0 0 12px;">Te invitaron a C y P</h1>
      <p>Te invitaron a colaborar en <strong>${escapeHtml(organizationName)}</strong>.</p>
      <p>
        <a href="${acceptUrl}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
          Aceptar invitacion
        </a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Este enlace vence en 14 dias.</p>
    </div>
  `;

  return { html, subject, text };
}

function getResendApiKey() {
  return process.env.RESEND_API_KEY?.trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
