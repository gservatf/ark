"use client";

import { CheckCircle2, Clock, Mail, XCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  acceptOrganizationInvitationById,
  listReceivedOrganizationInvitations,
  rejectOrganizationInvitation,
  type OrganizationInvitation
} from "@/lib/data/organizations";
import {
  clearStoredActiveProjectId,
  clearWorkspaceCache,
  setStoredActiveOrganizationId
} from "@/lib/data/workspace";
import { createBrowserClient } from "@/lib/supabase/browser";

type InvitationNotificationsPanelProps = {
  onAccepted?: () => void;
  onPendingCountChange?: (count: number) => void;
  open: boolean;
};

export function InvitationNotificationsPanel({
  onAccepted,
  onPendingCountChange,
  open
}: InvitationNotificationsPanelProps) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadInvitations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await listReceivedOrganizationInvitations(supabase);

    if (!result.ok) {
      setError(result.error.message);
      setIsLoading(false);
      onPendingCountChange?.(0);
      return;
    }

    setInvitations(result.data);
    setIsLoading(false);
    onPendingCountChange?.(result.data.length);
  }, [onPendingCountChange, supabase]);

  useEffect(() => {
    if (open) {
      void loadInvitations();
    }
  }, [loadInvitations, open]);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  async function handleAccept(invitationId: string) {
    setError(null);
    const result = await acceptOrganizationInvitationById(supabase, invitationId);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setStoredActiveOrganizationId(result.data.organizacion_id);
    clearStoredActiveProjectId();
    clearWorkspaceCache(supabase);
    await loadInvitations();
    onAccepted?.();
  }

  async function handleReject(invitationId: string) {
    setError(null);
    const result = await rejectOrganizationInvitation(supabase, invitationId);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    await loadInvitations();
  }

  if (!open) {
    return null;
  }

  return (
    <section className="absolute right-0 top-12 z-40 w-[min(430px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-950">Notificaciones</h2>
            <p className="mt-1 text-xs text-slate-500">Invitaciones y avisos importantes de tu cuenta.</p>
          </div>
          <Link
            className="rounded-lg px-2 py-1 text-xs font-bold text-brand-700 transition hover:bg-blue-50"
            href="/configuracion/organizaciones"
          >
            Ver todas
          </Link>
        </div>
      </div>

      <div className="max-h-[460px] overflow-y-auto p-2">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Cargando notificaciones...</p>
        ) : error ? (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
        ) : invitations.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Mail className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-800">Sin notificaciones pendientes</p>
            <p className="mt-1 text-xs text-slate-500">Las invitaciones a organizaciones apareceran aqui.</p>
          </div>
        ) : (
          invitations.map((invitation) => (
            <article className="rounded-xl p-3 transition hover:bg-slate-50" key={invitation.id}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand-600">
                  <Mail className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    Invitacion a {invitation.organizacionNombre || "organizacion"}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    Rol {invitation.rolOrganizacion}
                    {getProjectSummary(invitation)}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    Vence {formatInvitationDate(invitation.expiresAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-bold text-white transition hover:bg-brand-700"
                      onClick={() => void handleAccept(invitation.id)}
                      type="button"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Aceptar
                    </button>
                    <button
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                      onClick={() => void handleReject(invitation.id)}
                      type="button"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function formatInvitationDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function getProjectSummary(invitation: OrganizationInvitation) {
  const projectCount = invitation.proyectoNombres?.length || (invitation.proyectoNombre ? 1 : 0);
  const parts: string[] = [];

  if (projectCount > 0) {
    parts.push(`${projectCount} proyecto${projectCount === 1 ? "" : "s"}`);
  }

  if (invitation.incluirProyectosFuturos) {
    parts.push("proximos proyectos");
  }

  if (parts.length === 0) {
    return "";
  }

  return `, ${parts.join(" + ")} como ${invitation.rolProyecto}`;
}
