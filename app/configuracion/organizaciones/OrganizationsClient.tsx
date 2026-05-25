"use client";

import {
  Building2,
  ChevronDown,
  CheckCircle2,
  MailPlus,
  Plus,
  RefreshCcw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Users,
  XCircle
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  acceptOrganizationInvitation,
  acceptOrganizationInvitationById,
  createOrganization,
  listOrganizationMemberPermissions,
  listReceivedOrganizationInvitations,
  listSentOrganizationInvitations,
  rejectOrganizationInvitation,
  revokeOrganizationInvitation,
  updateOrganizationMemberPermissions,
  type OrganizationMemberPermissions,
  type ProjectAccessRole,
  type OrganizationInvitation
} from "@/lib/data/organizations";
import {
  clearStoredActiveProjectId,
  clearWorkspaceCache,
  resolveOrganizationWorkspace,
  setStoredActiveOrganizationId,
  type OrganizationSummary
} from "@/lib/data/workspace";
import { createBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type InviteResponse = {
  acceptUrl: string;
  acceptUrls?: string[];
  createdCount?: number;
  emailStatus: "sent" | "skipped" | "failed" | "mixed";
};

type InviteForm = {
  emails: string;
  incluirProyectosFuturos: boolean;
  proyectoIds: string[];
  rolOrganizacion: "admin" | "miembro";
  rolProyecto: "admin" | "editor" | "lector";
};

const initialOrganizationForm = { nombre: "", ruc: "" };
const initialInviteForm: InviteForm = {
  emails: "",
  incluirProyectosFuturos: false,
  proyectoIds: [],
  rolOrganizacion: "miembro",
  rolProyecto: "editor"
};

export function OrganizationsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<OrganizationSummary | null>(null);
  const [memberPermissions, setMemberPermissions] = useState<OrganizationMemberPermissions[]>([]);
  const [sentInvitations, setSentInvitations] = useState<OrganizationInvitation[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<OrganizationInvitation[]>([]);
  const [organizationForm, setOrganizationForm] = useState(initialOrganizationForm);
  const [inviteForm, setInviteForm] = useState(initialInviteForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingOrganization, setIsSavingOrganization] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const workspaceResult = await resolveOrganizationWorkspace(supabase);

    if (!workspaceResult.ok) {
      setError(workspaceResult.error.message);
      setIsLoading(false);
      return;
    }

    const active = workspaceResult.data.activeOrganization;
    const [sentResult, receivedResult, membersResult] = await Promise.all([
      listSentOrganizationInvitations(supabase, active.id),
      listReceivedOrganizationInvitations(supabase),
      active.canMutate ? listOrganizationMemberPermissions(supabase, active.id) : Promise.resolve(null)
    ]);

    setOrganizations(workspaceResult.data.organizations);
    setActiveOrganization(active);
    setSentInvitations(sentResult.ok ? sentResult.data : []);
    setReceivedInvitations(receivedResult.ok ? receivedResult.data : []);
    setMemberPermissions(membersResult?.ok ? membersResult.data : []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const token = searchParams.get("invite");

    if (!token) {
      return;
    }

    const inviteToken = token;

    async function acceptTokenInvite() {
      setFeedback(null);
      setError(null);
      const result = await acceptOrganizationInvitation(supabase, inviteToken);

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setStoredActiveOrganizationId(result.data.organizacion_id);
      clearStoredActiveProjectId();
      clearWorkspaceCache(supabase);
      setFeedback("Invitacion aceptada. Ya puedes cambiar a esa organizacion desde el selector superior.");
      router.replace("/configuracion/organizaciones", { scroll: false });
      await loadData();
      router.refresh();
    }

    void acceptTokenInvite();
  }, [loadData, router, searchParams, supabase]);

  const activeProjects = activeOrganization?.projects || [];
  const canAdminActiveOrganization = Boolean(activeOrganization?.canMutate);
  const isAdminInvite = inviteForm.rolOrganizacion === "admin";
  const effectiveProjectIds = isAdminInvite ? activeProjects.map((project) => project.id) : inviteForm.proyectoIds;
  const effectiveIncludeFutureProjects = isAdminInvite || inviteForm.incluirProyectosFuturos;
  const effectiveProjectRole = isAdminInvite ? "admin" : inviteForm.rolProyecto;

  async function handleSelectOrganization(organizationId: string) {
    setStoredActiveOrganizationId(organizationId);
    clearStoredActiveProjectId();
    clearWorkspaceCache(supabase);
    setInviteForm(initialInviteForm);
    await loadData();
    router.refresh();
  }

  async function handleCreateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingOrganization(true);
    setError(null);
    setFeedback(null);

    const result = await createOrganization(supabase, organizationForm);
    setIsSavingOrganization(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setStoredActiveOrganizationId(result.data.id);
    clearStoredActiveProjectId();
    clearWorkspaceCache(supabase);
    setOrganizationForm(initialOrganizationForm);
    setFeedback("Organizacion creada correctamente.");
    await loadData();
    router.refresh();
  }

  async function handleCreateInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeOrganization) {
      return;
    }

    setIsSendingInvite(true);
    setError(null);
    setFeedback(null);

    const response = await fetch("/api/organizaciones/invitaciones", {
      body: JSON.stringify({
        email: inviteForm.emails,
        incluirProyectosFuturos: effectiveIncludeFutureProjects,
        organizationName: activeOrganization.nombre,
        organizacionId: activeOrganization.id,
        proyectoIds: effectiveProjectIds,
        rolOrganizacion: inviteForm.rolOrganizacion,
        rolProyecto:
          effectiveProjectIds.length > 0 || effectiveIncludeFutureProjects
            ? effectiveProjectRole
            : null
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });
    const payload = (await response.json().catch(() => null)) as (InviteResponse & { error?: string }) | null;
    setIsSendingInvite(false);

    if (!response.ok || !payload) {
      setError(payload?.error || "No se pudo crear la invitacion.");
      return;
    }

    setInviteForm(initialInviteForm);
    setFeedback(getInvitationFeedback(payload));
    await copyInviteLinks(payload.acceptUrls || [payload.acceptUrl]);
    await loadData();
  }

  async function handleRegenerateInvitation(invitation: OrganizationInvitation) {
    if (!activeOrganization) {
      return;
    }

    const response = await fetch("/api/organizaciones/invitaciones", {
      body: JSON.stringify({
        action: "regenerate",
        invitationId: invitation.id,
        organizationName: activeOrganization.nombre
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });
    const payload = (await response.json().catch(() => null)) as (InviteResponse & { error?: string }) | null;

    if (!response.ok || !payload) {
      setError(payload?.error || "No se pudo regenerar la invitacion.");
      return;
    }

    setFeedback(getInvitationFeedback(payload));
    await copyInviteLinks(payload.acceptUrls || [payload.acceptUrl]);
    await loadData();
  }

  async function handleRevokeInvitation(invitationId: string) {
    const result = await revokeOrganizationInvitation(supabase, invitationId);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setFeedback("Invitacion revocada.");
    await loadData();
  }

  async function handleRejectInvitation(invitationId: string) {
    const result = await rejectOrganizationInvitation(supabase, invitationId);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setFeedback("Invitacion rechazada.");
    await loadData();
  }

  async function handleAcceptInvitation(invitationId: string) {
    const result = await acceptOrganizationInvitationById(supabase, invitationId);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setStoredActiveOrganizationId(result.data.organizacion_id);
    clearStoredActiveProjectId();
    clearWorkspaceCache(supabase);
    setFeedback("Invitacion aceptada. La organizacion ya esta disponible en tu selector.");
    await loadData();
    router.refresh();
  }

  async function handleSaveMemberPermissions(
    member: OrganizationMemberPermissions,
    input: {
      accesoTodosProyectos: boolean;
      projectAccess: Array<{ projectId: string; rol: ProjectAccessRole }>;
      rolOrganizacion: "admin" | "miembro";
      rolProyectoPredeterminado: ProjectAccessRole | null;
    }
  ) {
    if (!activeOrganization) {
      return;
    }

    setSavingMemberId(member.id);
    setError(null);
    setFeedback(null);

    const result = await updateOrganizationMemberPermissions(supabase, {
      accesoTodosProyectos: input.accesoTodosProyectos,
      memberId: member.id,
      organizacionId: activeOrganization.id,
      projectAccess: input.projectAccess,
      rolOrganizacion: input.rolOrganizacion,
      rolProyectoPredeterminado: input.rolProyectoPredeterminado
    });

    setSavingMemberId(null);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setMemberPermissions(result.data);
    clearWorkspaceCache(supabase);
    setFeedback("Permisos actualizados correctamente.");
    await loadData();
    router.refresh();
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto w-full max-w-[1440px] px-5 py-6 lg:px-8">
          <LoadingState label="Cargando organizaciones" rows={6} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 py-6 lg:px-8">
        <PageHeader
          actions={<Button icon={RefreshCcw} onClick={() => void loadData()} variant="secondary">Recargar</Button>}
          description="Administra tu espacio personal, organizaciones de empresa e invitaciones de colaboracion."
          eyebrow="Configuracion"
          title="Organizaciones"
        />

        {feedback ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{feedback}</p> : null}
        {error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Mis organizaciones</h2>
                <p className="mt-1 text-sm text-slate-500">Cambia el contexto activo sin mezclar proyectos ni catalogos.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {organizations.map((organization) => (
                <button
                  className={cn(
                    "rounded-2xl border p-4 text-left transition hover:border-blue-200 hover:bg-blue-50",
                    activeOrganization?.id === organization.id ? "border-brand-500 bg-blue-50" : "border-slate-200 bg-white"
                  )}
                  key={organization.id}
                  onClick={() => void handleSelectOrganization(organization.id)}
                  type="button"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-950">{organization.nombre}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {organization.tipoOrganizacion === "personal" ? "Personal" : "Empresa"} - {organization.rol}
                      </span>
                      <span className="mt-2 block text-xs font-semibold text-slate-600">
                        {organization.projects.length} proyectos disponibles
                      </span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-bold text-slate-950">Crear organizacion de empresa</h2>
            <p className="mt-1 text-sm text-slate-500">Para separar proyectos, recursos y permisos de una empresa.</p>
            <form className="mt-4 space-y-4" onSubmit={handleCreateOrganization}>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Nombre</span>
                <input
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, nombre: event.target.value }))}
                  required
                  value={organizationForm.nombre}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">RUC</span>
                <input
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
                  maxLength={11}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, ruc: event.target.value }))}
                  placeholder="Opcional"
                  value={organizationForm.ruc}
                />
              </label>
              <Button disabled={isSavingOrganization} icon={Plus} type="submit">
                {isSavingOrganization ? "Creando..." : "Crear organizacion"}
              </Button>
            </form>
          </article>
        </section>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                <Users className="h-5 w-5 text-brand-600" />
                Miembros y permisos
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Revisa el rol de cada persona en la organizacion activa y sus accesos por proyecto.
              </p>
            </div>
            {activeOrganization ? (
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                {activeOrganization.nombre}
              </span>
            ) : null}
          </div>
          <div className="mt-4 space-y-3">
            {!canAdminActiveOrganization ? (
              <EmptyState
                description="Solo owners y admins pueden ver y editar la matriz completa de permisos."
                title="Permisos restringidos"
              />
            ) : memberPermissions.length > 0 && activeOrganization ? (
              memberPermissions.map((member) => (
                <MemberPermissionsCard
                  activeMembershipId={activeOrganization.membershipId}
                  isExpanded={expandedMemberId === member.id}
                  isSaving={savingMemberId === member.id}
                  key={member.id}
                  member={member}
                  onSave={handleSaveMemberPermissions}
                  onToggle={() => setExpandedMemberId((current) => (current === member.id ? null : member.id))}
                />
              ))
            ) : (
              <EmptyState
                description="Cuando haya miembros activos en esta organizacion, apareceran aqui."
                title="Sin miembros para mostrar"
              />
            )}
          </div>
        </article>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-bold text-slate-950">Invitar colaborador</h2>
            <p className="mt-1 text-sm text-slate-500">
              La invitacion entra a la organizacion activa y puede incluir acceso a un proyecto.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleCreateInvitation}>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Correos</span>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
                  disabled={!canAdminActiveOrganization}
                  onChange={(event) => setInviteForm((current) => ({ ...current, emails: event.target.value }))}
                  placeholder="usuario1@example.com usuario2@example.com"
                  required
                  value={inviteForm.emails}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Puedes separar varios correos con espacios, comas o saltos de linea.
                </span>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Rol en organizacion</span>
                  <select
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
                    disabled={!canAdminActiveOrganization}
                    onChange={(event) =>
                      setInviteForm((current) => ({
                        ...current,
                        incluirProyectosFuturos:
                          event.target.value === "admin" ? true : current.incluirProyectosFuturos,
                        proyectoIds:
                          event.target.value === "admin" ? activeProjects.map((project) => project.id) : current.proyectoIds,
                        rolOrganizacion: event.target.value as "admin" | "miembro",
                        rolProyecto: event.target.value === "admin" ? "admin" : current.rolProyecto
                      }))
                    }
                    value={inviteForm.rolOrganizacion}
                  >
                    <option value="miembro">Miembro</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Rol en proyectos</span>
                  <select
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={!canAdminActiveOrganization || isAdminInvite}
                    onChange={(event) =>
                      setInviteForm((current) => ({
                        ...current,
                        rolProyecto: event.target.value as "admin" | "editor" | "lector"
                      }))
                    }
                    value={effectiveProjectRole}
                  >
                    <option value="lector">Lector</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-700">Proyectos actuales</span>
                  <button
                    className="text-xs font-bold text-brand-700 transition hover:text-brand-800 disabled:text-slate-400"
                    disabled={!canAdminActiveOrganization || isAdminInvite || activeProjects.length === 0}
                    onClick={() =>
                      setInviteForm((current) => ({
                        ...current,
                        proyectoIds:
                          current.proyectoIds.length === activeProjects.length
                            ? []
                            : activeProjects.map((project) => project.id)
                      }))
                    }
                    type="button"
                  >
                    {effectiveProjectIds.length === activeProjects.length ? "Quitar todos" : "Marcar todos"}
                  </button>
                </div>
                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
                  {activeProjects.length > 0 ? (
                    activeProjects.map((project) => {
                      const checked = effectiveProjectIds.includes(project.id);

                      return (
                        <label
                          className={cn(
                            "flex items-start gap-3 rounded-lg p-2 text-sm transition",
                            checked ? "bg-blue-50" : "hover:bg-slate-50",
                            isAdminInvite && "cursor-not-allowed opacity-75"
                          )}
                          key={project.id}
                        >
                          <input
                            checked={checked}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            disabled={!canAdminActiveOrganization || isAdminInvite}
                            onChange={(event) =>
                              setInviteForm((current) => ({
                                ...current,
                                proyectoIds: event.target.checked
                                  ? [...current.proyectoIds, project.id]
                                  : current.proyectoIds.filter((projectId) => projectId !== project.id)
                              }))
                            }
                            type="checkbox"
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-bold text-slate-900">{project.nombre}</span>
                            <span className="block truncate text-xs text-slate-500">
                              {[project.cliente, project.ubicacion].filter(Boolean).join(" - ") || "Sin cliente"}
                            </span>
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">Esta organizacion todavia no tiene proyectos.</p>
                  )}
                </div>
              </div>
              <label
                className={cn(
                  "flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm",
                  isAdminInvite && "bg-slate-50 text-slate-500"
                )}
              >
                <input
                  checked={effectiveIncludeFutureProjects}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  disabled={!canAdminActiveOrganization || isAdminInvite}
                  onChange={(event) =>
                    setInviteForm((current) => ({ ...current, incluirProyectosFuturos: event.target.checked }))
                  }
                  type="checkbox"
                />
                <span>
                  <span className="block font-bold text-slate-800">Incluir automaticamente en proximos proyectos</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Los admins de organizacion siempre quedan incluidos en todos los proyectos actuales y futuros.
                  </span>
                </span>
              </label>
              <Button disabled={!canAdminActiveOrganization || isSendingInvite} icon={MailPlus} type="submit">
                {isSendingInvite ? "Enviando..." : "Crear invitacion"}
              </Button>
            </form>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-bold text-slate-950">Invitaciones enviadas</h2>
            <div className="mt-4 space-y-3">
              {sentInvitations.length > 0 ? (
                sentInvitations.map((invitation) => (
                  <InvitationRow
                    invitation={invitation}
                    key={invitation.id}
                    right={
                      invitation.estado === "pendiente" ? (
                        <>
                          <Button icon={Send} onClick={() => void handleRegenerateInvitation(invitation)} variant="secondary">
                            Reenviar
                          </Button>
                          <Button icon={Trash2} onClick={() => void handleRevokeInvitation(invitation.id)} variant="secondary">
                            Revocar
                          </Button>
                        </>
                      ) : null
                    }
                  />
                ))
              ) : (
                <EmptyState
                  description="Cuando invites colaboradores a esta organizacion, apareceran aqui."
                  title="Sin invitaciones enviadas"
                />
              )}
            </div>
          </article>
        </section>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-950">Invitaciones recibidas</h2>
          <div className="mt-4 space-y-3">
            {receivedInvitations.length > 0 ? (
              receivedInvitations.map((invitation) => (
                <InvitationRow
                  invitation={invitation}
                  key={invitation.id}
                  right={
                    <>
                      <Button icon={CheckCircle2} onClick={() => void handleAcceptInvitation(invitation.id)}>
                        Aceptar
                      </Button>
                      <Button icon={XCircle} onClick={() => void handleRejectInvitation(invitation.id)} variant="secondary">
                        Rechazar
                      </Button>
                    </>
                  }
                />
              ))
            ) : (
              <EmptyState
                description="Las invitaciones pendientes para tu correo verificado apareceran en esta seccion."
                title="No tienes invitaciones pendientes"
              />
            )}
          </div>
        </article>
      </div>
    </AppLayout>
  );
}

function InvitationRow({
  invitation,
  right
}: {
  invitation: OrganizationInvitation;
  right?: ReactNode;
}) {
  const projectSummary = getInvitationProjectSummary(invitation);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-950">{invitation.email}</p>
        <p className="mt-1 text-xs text-slate-500">
          {invitation.organizacionNombre || "Organizacion"} - {invitation.rolOrganizacion}
          {projectSummary ? ` - ${projectSummary}` : ""}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-600">Estado: {invitation.estado}</p>
      </div>
      {right ? <div className="flex flex-wrap gap-2">{right}</div> : null}
    </div>
  );
}

function MemberPermissionsCard({
  activeMembershipId,
  isExpanded,
  isSaving,
  member,
  onSave,
  onToggle
}: {
  activeMembershipId: string;
  isExpanded: boolean;
  isSaving: boolean;
  member: OrganizationMemberPermissions;
  onSave: (
    member: OrganizationMemberPermissions,
    input: {
      accesoTodosProyectos: boolean;
      projectAccess: Array<{ projectId: string; rol: ProjectAccessRole }>;
      rolOrganizacion: "admin" | "miembro";
      rolProyectoPredeterminado: ProjectAccessRole | null;
    }
  ) => Promise<void>;
  onToggle: () => void;
}) {
  const isOwner = member.rolOrganizacion === "owner";
  const isSelf = member.id === activeMembershipId;
  const isOrgAdmin = member.rolOrganizacion === "admin";
  const isLocked = isOwner || isSelf;
  const initialProjectAccess = useMemo(
    () =>
      member.projects
        .filter((project) => Boolean(project.effectiveRole))
        .map((project) => ({
          projectId: project.projectId,
          rol: (project.effectiveRole || "lector") as ProjectAccessRole
        })),
    [member.projects]
  );
  const [rolOrganizacion, setRolOrganizacion] = useState<"admin" | "miembro">(
    member.rolOrganizacion === "admin" ? "admin" : "miembro"
  );
  const [accesoTodosProyectos, setAccesoTodosProyectos] = useState(
    member.rolOrganizacion === "admin" || member.accesoTodosProyectos
  );
  const [rolProyectoPredeterminado, setRolProyectoPredeterminado] = useState<ProjectAccessRole>(
    (member.rolOrganizacion === "admin" ? "admin" : member.rolProyectoPredeterminado) || "lector"
  );
  const [projectAccess, setProjectAccess] =
    useState<Array<{ projectId: string; rol: ProjectAccessRole }>>(initialProjectAccess);

  useEffect(() => {
    setRolOrganizacion(member.rolOrganizacion === "admin" ? "admin" : "miembro");
    setAccesoTodosProyectos(member.rolOrganizacion === "admin" || member.accesoTodosProyectos);
    setRolProyectoPredeterminado(
      (member.rolOrganizacion === "admin" ? "admin" : member.rolProyectoPredeterminado) || "lector"
    );
    setProjectAccess(initialProjectAccess);
  }, [initialProjectAccess, member.accesoTodosProyectos, member.rolOrganizacion, member.rolProyectoPredeterminado]);

  const effectiveAllProjects = rolOrganizacion === "admin" || accesoTodosProyectos;
  const projectCount = member.projects.filter((project) => Boolean(project.effectiveRole)).length;

  function toggleProject(projectId: string, enabled: boolean) {
    setProjectAccess((current) => {
      if (enabled) {
        return current.some((item) => item.projectId === projectId)
          ? current
          : [...current, { projectId, rol: "lector" }];
      }

      return current.filter((item) => item.projectId !== projectId);
    });
  }

  function setProjectRole(projectId: string, rol: ProjectAccessRole) {
    setProjectAccess((current) =>
      current.map((item) => (item.projectId === projectId ? { ...item, rol } : item))
    );
  }

  function getSelectedRole(projectId: string) {
    return projectAccess.find((item) => item.projectId === projectId)?.rol || "lector";
  }

  return (
    <article className="rounded-2xl border border-slate-200">
      <button
        className="flex w-full flex-col gap-3 p-4 text-left transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
        onClick={onToggle}
        type="button"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-slate-950">{member.displayName}</span>
          <span className="mt-1 block truncate text-xs text-slate-500">{member.email || "Sin correo visible"}</span>
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {getOrganizationRoleLabel(member.rolOrganizacion)}
          </span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-700">
            {isOrgAdmin || isOwner || member.accesoTodosProyectos
              ? "Todos los proyectos"
              : `${projectCount} proyecto${projectCount === 1 ? "" : "s"}`}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-slate-400 transition", isExpanded && "rotate-180")}
          />
        </span>
      </button>

      {isExpanded ? (
        <div className="border-t border-slate-200 p-4">
          {isLocked ? (
            <p className="mb-4 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">
              {isOwner
                ? "El owner mantiene administracion total y no se edita desde este panel."
                : "No puedes editar tus propios permisos desde este panel."}
            </p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Rol en organizacion</span>
              <select
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
                disabled={isLocked}
                onChange={(event) => {
                  const nextRole = event.target.value as "admin" | "miembro";
                  setRolOrganizacion(nextRole);
                  if (nextRole === "admin") {
                    setAccesoTodosProyectos(true);
                    setRolProyectoPredeterminado("admin");
                  }
                }}
                value={rolOrganizacion}
              >
                <option value="miembro">Miembro</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Acceso futuro</span>
              <select
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
                disabled={isLocked || rolOrganizacion === "admin"}
                onChange={(event) => setAccesoTodosProyectos(event.target.value === "todos")}
                value={effectiveAllProjects ? "todos" : "seleccionados"}
              >
                <option value="seleccionados">Solo seleccionados</option>
                <option value="todos">Todos y futuros</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Rol por defecto</span>
              <select
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
                disabled={isLocked || !effectiveAllProjects || rolOrganizacion === "admin"}
                onChange={(event) => setRolProyectoPredeterminado(event.target.value as ProjectAccessRole)}
                value={rolOrganizacion === "admin" ? "admin" : rolProyectoPredeterminado}
              >
                <option value="lector">Lector</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200">
            <div className="grid grid-cols-[1fr_140px] gap-3 border-b border-slate-200 px-3 py-2 text-xs font-bold uppercase text-slate-400 md:grid-cols-[1fr_140px_160px]">
              <span>Proyecto</span>
              <span>Acceso</span>
              <span className="hidden md:block">Rol</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {member.projects.length > 0 ? (
                member.projects.map((project) => {
                  const checked =
                    rolOrganizacion === "admin" ||
                    effectiveAllProjects ||
                    projectAccess.some((item) => item.projectId === project.projectId);
                  const selectedRole =
                    rolOrganizacion === "admin"
                      ? "admin"
                      : effectiveAllProjects
                        ? rolProyectoPredeterminado
                        : getSelectedRole(project.projectId);

                  return (
                    <div
                      className="grid grid-cols-[1fr_140px] gap-3 px-3 py-3 text-sm md:grid-cols-[1fr_140px_160px]"
                      key={project.projectId}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{project.projectName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {[project.cliente, project.ubicacion].filter(Boolean).join(" - ") || "Sin cliente"}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <input
                          checked={checked}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          disabled={isLocked || effectiveAllProjects}
                          onChange={(event) => toggleProject(project.projectId, event.target.checked)}
                          type="checkbox"
                        />
                        {checked ? "Incluido" : "Sin acceso"}
                      </label>
                      <select
                        className="col-span-2 h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400 md:col-span-1"
                        disabled={isLocked || !checked || effectiveAllProjects}
                        onChange={(event) => setProjectRole(project.projectId, event.target.value as ProjectAccessRole)}
                        value={selectedRole}
                      >
                        <option value="lector">Lector</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  );
                })
              ) : (
                <p className="p-4 text-sm text-slate-500">Esta organizacion todavia no tiene proyectos.</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              disabled={isLocked || isSaving}
              icon={Save}
              onClick={() =>
                void onSave(member, {
                  accesoTodosProyectos: effectiveAllProjects,
                  projectAccess: effectiveAllProjects ? [] : projectAccess,
                  rolOrganizacion,
                  rolProyectoPredeterminado: effectiveAllProjects ? rolProyectoPredeterminado : null
                })
              }
            >
              {isSaving ? "Guardando..." : "Guardar permisos"}
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function getInvitationProjectSummary(invitation: OrganizationInvitation) {
  const projectNames = invitation.proyectoNombres?.length
    ? invitation.proyectoNombres
    : invitation.proyectoNombre
      ? [invitation.proyectoNombre]
      : [];
  const parts: string[] = [];

  if (projectNames.length > 0) {
    parts.push(`${projectNames.length} proyecto${projectNames.length === 1 ? "" : "s"}`);
  }

  if (invitation.incluirProyectosFuturos) {
    parts.push("proximos proyectos");
  }

  if (parts.length === 0) {
    return "";
  }

  return `${parts.join(" + ")} (${invitation.rolProyecto})`;
}

function getOrganizationRoleLabel(role: OrganizationMemberPermissions["rolOrganizacion"]) {
  if (role === "owner") {
    return "Owner";
  }

  if (role === "admin") {
    return "Admin";
  }

  return "Miembro";
}

async function copyInviteLinks(values: string[]) {
  if (!navigator.clipboard) {
    return;
  }

  await navigator.clipboard.writeText(values.join("\n")).catch(() => undefined);
}

function getInvitationFeedback(payload: InviteResponse) {
  const count = payload.createdCount || 1;
  const prefix = count === 1 ? "Invitacion creada" : `${count} invitaciones creadas`;

  if (payload.emailStatus === "sent") {
    return `${prefix}, correos enviados y enlaces copiados.`;
  }

  if (payload.emailStatus === "failed") {
    return `${prefix} y enlaces copiados. Uno o mas correos no pudieron enviarse.`;
  }

  if (payload.emailStatus === "mixed") {
    return `${prefix} y enlaces copiados. Algunos correos se enviaron y otros quedaron solo como enlace.`;
  }

  return `${prefix} y enlaces copiados. Configura RESEND_API_KEY para enviar correos desde la app.`;
}
