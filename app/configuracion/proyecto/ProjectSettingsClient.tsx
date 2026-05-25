"use client";

import { Building2, ClipboardList, Settings } from "lucide-react";
import Link from "next/link";

import { AppLayout } from "@/components/layout/AppLayout";
import { useWorkspaceNavigation } from "@/components/layout/useWorkspaceNavigation";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ProjectSettingsClient() {
  const { activeOrganization, activeProject, error, isLoading, scope } = useWorkspaceNavigation();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto w-full max-w-[1200px] px-5 py-6 lg:px-8">
          <LoadingState label="Cargando configuracion del proyecto" rows={4} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 py-6 lg:px-8">
        <PageHeader
          description="Ajustes propios del proyecto seleccionado en la barra superior."
          eyebrow="Configuracion"
          title="Configuracion del proyecto"
        />

        {error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}

        {!activeProject ? (
          <EmptyState
            description="Selecciona una organizacion con proyectos o crea un nuevo proyecto desde el selector superior."
            title="No hay proyecto seleccionado"
          />
        ) : (
          <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand-600">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">{activeProject.nombre}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeProject.cliente || "Sin cliente"} - {activeProject.ubicacion || "Sin ubicacion"}
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <ProjectSettingItem label="Organizacion" value={activeOrganization?.nombre || "Sin organizacion"} />
                <ProjectSettingItem label="Rol activo" value={scope?.proyectoId ? "Proyecto seleccionado" : "Organizacion"} />
                <ProjectSettingItem label="Cliente" value={activeProject.cliente || "Pendiente"} />
                <ProjectSettingItem label="Ubicacion" value={activeProject.ubicacion || "Pendiente"} />
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-brand-700"
                  href={`/presupuestos/${activeProject.id}`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Abrir presupuesto
                </Link>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Settings className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Ajustes disponibles</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Esta seccion queda reservada para permisos, moneda, datos comerciales y parametros del proyecto.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Building2 className="h-4 w-4" />
                  Contexto actual
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Las organizaciones e invitaciones ahora se administran desde el menu de perfil en la esquina superior derecha.
                </p>
              </div>
            </article>
          </section>
        )}
      </div>
    </AppLayout>
  );
}

function ProjectSettingItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <dt className="text-xs font-bold uppercase text-slate-400">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
