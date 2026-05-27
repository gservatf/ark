"use client";

import { ArrowLeft, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import {
  ApuBuilderPanel,
  buildApuFormFromResource,
  defaultApuFormForGroup,
  type ApuBuilderFormState
} from "@/components/partidas/ApuBuilderPanel";
import { ApuResourcesTable } from "@/components/partidas/ApuResourcesTable";
import { ApuSummaryCard } from "@/components/partidas/ApuSummaryCard";
import { formatNumber } from "@/components/partidas/partida-ui";
import { ActivityToasts } from "@/components/shared/ActivityToasts";
import { Button } from "@/components/shared/Button";
import { ConflictResolutionDialog } from "@/components/shared/ConflictResolutionDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PresenceBar } from "@/components/shared/PresenceBar";
import {
  calculateApuDirectCost,
  calculateApuUnitPrice
} from "@/lib/calculations/apu";
import { isOptimisticConflict } from "@/lib/data/conflicts";
import {
  createPartidaResource,
  deletePartidaResource,
  getPartidaBundle,
  updatePartidaResource
} from "@/lib/data/items";
import { listResources } from "@/lib/data/resources";
import type { DataError, DataScope } from "@/lib/data/types";
import { canManageOrganizationCatalog, resolveOrganizationWorkspace } from "@/lib/data/workspace";
import type { ActivityRealtimePayload } from "@/lib/realtime/activity";
import type { PresenceTarget } from "@/lib/realtime/presence";
import { useActivitySubscription } from "@/lib/realtime/useActivitySubscription";
import { usePresenceChannel } from "@/lib/realtime/usePresenceChannel";
import { createBrowserClient } from "@/lib/supabase/browser";
import { validateFormData } from "@/lib/validations/form";
import {
  partidaApuResourceFormSchema,
  type PartidaApuResourceFormInput
} from "@/lib/validations/items";
import type { GrupoApu, Partida, PartidaRecurso, Recurso } from "@/types/domain";

type PartidaDetailPageProps = {
  params: {
    id: string;
  };
};

type WorkspaceState = {
  canMutate: boolean;
  scope: DataScope;
};

const baseForm: ApuBuilderFormState = {
  cantidad_base: "1",
  cuadrilla: "1",
  grupo: "materiales",
  porcentaje_aplicado: "3",
  recurso_id: "",
  tipo_calculo_apu: "material_desperdicio"
};

export default function PartidaDetailPage({ params }: PartidaDetailPageProps) {
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [partida, setPartida] = useState<Partida | null>(null);
  const [apuResources, setApuResources] = useState<PartidaRecurso[]>([]);
  const [catalogResources, setCatalogResources] = useState<Recurso[]>([]);
  const [form, setForm] = useState<ApuBuilderFormState>(baseForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ApuBuilderFormState, string>>>(
    {}
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [conflict, setConflict] = useState<{ error: DataError; retry: () => Promise<void> } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setMutationError(null);

    const supabase = createBrowserClient();
    const workspaceResult = await resolveOrganizationWorkspace(supabase);

    if (!workspaceResult.ok) {
      setLoadError(workspaceResult.error.message);
      setIsLoading(false);
      return;
    }

    const nextWorkspace: WorkspaceState = {
      ...workspaceResult.data,
      canMutate: canManageOrganizationCatalog(workspaceResult.data)
    };

    const [bundleResult, resourcesResult] = await Promise.all([
      getPartidaBundle(supabase, nextWorkspace.scope, params.id),
      listResources(supabase, nextWorkspace.scope)
    ]);

    if (!bundleResult.ok) {
      setLoadError(errorMessage(bundleResult.error));
      setIsLoading(false);
      return;
    }

    if (!resourcesResult.ok) {
      setLoadError(errorMessage(resourcesResult.error));
      setIsLoading(false);
      return;
    }

    setWorkspace(nextWorkspace);
    setPartida(bundleResult.data.partida);
    setApuResources(bundleResult.data.resources);
    setCatalogResources(resourcesResult.data);
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activityTopic = useMemo(
    () => (workspace ? { organizacionId: workspace.scope.organizacionId, type: "org" as const } : undefined),
    [workspace]
  );
  const activityFilter = useCallback(
    (payload: ActivityRealtimePayload) =>
      payload.entityType === "recurso" ||
      (payload.entityType === "partida" && payload.entityId === params.id) ||
      (payload.entityType === "partida_recurso" && payload.metadata.partida_id === params.id),
    [params.id]
  );
  const activity = useActivitySubscription({
    currentActorId: workspace?.scope.actorId,
    enabled: Boolean(workspace),
    filter: activityFilter,
    onRefetch: loadData,
    topicScope: activityTopic
  });
  const editingResource = editingId ? apuResources.find((resource) => resource.id === editingId) : undefined;
  const presenceTarget: PresenceTarget | null = partida
    ? { id: editingResource?.id || partida.id, label: editingResource ? "este recurso APU" : partida.nombre, type: editingResource ? "partida_recurso" : "partida" }
    : null;
  const presence = usePresenceChannel({
    editing: editingResource ? presenceTarget : null,
    enabled: Boolean(workspace),
    page: `/partidas/${params.id}`,
    topicScope: activityTopic,
    viewing: presenceTarget
  });

  const directTotals = useMemo(() => calculateApuDirectCost(apuResources, partida || undefined), [apuResources, partida]);
  const gastosGenerales = 0;
  const utilidad = 0;
  const unitPrice = calculateApuUnitPrice({
    costo_directo: directTotals.costo_directo,
    gastos_generales_porcentaje: gastosGenerales,
    utilidad_porcentaje: utilidad
  });

  function handleFormChange<Field extends keyof ApuBuilderFormState>(
    field: Field,
    value: ApuBuilderFormState[Field]
  ) {
    const nextForm = { ...form, [field]: value };

    if (field === "grupo") {
      Object.assign(nextForm, defaultApuFormForGroup(value as GrupoApu), {
        recurso_id: ""
      });
    }

    if (field === "recurso_id") {
      const resource = catalogResources.find((item) => item.id === value);

      if (resource) {
        Object.assign(nextForm, buildApuFormFromResource(resource));
      }
    }

    setForm(nextForm);
    setFormErrors((current) => ({ ...current, [field]: undefined }));
    setMutationError(null);
    setConflict(null);
  }

  async function handleSubmit() {
    if (!workspace || !partida) {
      setMutationError("No se encontró una partida activa para guardar el APU.");
      return;
    }

    if (!workspace.canMutate) {
      setMutationError("Solo admins de proyecto u organización pueden guardar el APU.");
      return;
    }

    const validation = validateFormData<typeof partidaApuResourceFormSchema, keyof ApuBuilderFormState>(
      partidaApuResourceFormSchema,
      {
        cantidad_base: form.cantidad_base,
        cuadrilla: form.cuadrilla,
        grupo: form.grupo,
        orden: editingId ? undefined : apuResources.length + 1,
        partida_id: partida.id,
        porcentaje_aplicado: form.porcentaje_aplicado,
        recurso_id: form.recurso_id,
        tipo_calculo_apu: form.tipo_calculo_apu
      }
    );

    if (Object.keys(validation.errors).length > 0 || !validation.data) {
      setFormErrors(validation.errors);
      return;
    }

    const formData = validation.data;
    setIsSaving(true);
    setMutationError(null);

    const result = editingId
      ? await updatePartidaResource(createBrowserClient(), workspace.scope, editingId, formData, {
          attempted: formData,
          base: editingResource,
          expectedUpdatedAt: editingResource?.updated_at
        })
      : await createPartidaResource(createBrowserClient(), workspace.scope, formData);

    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error) && editingId) {
        setConflict({
          error: result.error,
          retry: () => retryApuResourceUpdate(editingId, formData, result.error)
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setApuResources((current) =>
      editingId
        ? current.map((resource) => (resource.id === result.data.id ? result.data : resource))
        : [...current, result.data].sort((a, b) => a.orden - b.orden)
    );
    setEditingId(null);
    setForm(baseForm);
    setFormErrors({});
  }

  function openEdit(resource: PartidaRecurso) {
    if (!workspace?.canMutate) {
      setMutationError("Solo admins de proyecto u organización pueden editar el APU.");
      return;
    }

    setEditingId(resource.id);
    setForm({
      cantidad_base: String(resource.cantidad_base ?? resource.cantidad),
      cuadrilla: String(resource.cuadrilla ?? ""),
      grupo: resource.grupo,
      porcentaje_aplicado: String(resource.porcentaje_aplicado ?? 3),
      recurso_id: resource.recurso_id,
      tipo_calculo_apu: resource.tipo_calculo_apu
    });
    setFormErrors({});
    setMutationError(null);
    setConflict(null);
  }

  async function removeResource(resourceId: string) {
    if (!workspace?.canMutate) {
      setMutationError("Solo admins de proyecto u organización pueden quitar recursos APU.");
      return;
    }

    setIsSaving(true);
    setMutationError(null);

    const resource = apuResources.find((item) => item.id === resourceId);
    const result = await deletePartidaResource(createBrowserClient(), workspace.scope, resourceId, {
      attempted: null,
      base: resource,
      expectedUpdatedAt: resource?.updated_at
    });

    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error) && resource) {
        setConflict({
          error: result.error,
          retry: () => retryApuResourceDelete(resource, result.error)
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setApuResources((current) => current.filter((resource) => resource.id !== resourceId));
    if (editingId === resourceId) {
      cancelEdit();
    }
  }

  async function retryApuResourceUpdate(resourceId: string, input: PartidaApuResourceFormInput, error: DataError) {
    if (!workspace) {
      return;
    }

    const expectedUpdatedAt = getPersistedUpdatedAt(error);

    if (!expectedUpdatedAt) {
      void loadData();
      return;
    }

    setIsSaving(true);
    setMutationError(null);
    const result = await updatePartidaResource(createBrowserClient(), workspace.scope, resourceId, input, {
      attempted: input,
      expectedUpdatedAt
    });
    setIsSaving(false);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    setApuResources((current) => current.map((resource) => (resource.id === result.data.id ? result.data : resource)));
    cancelEdit();
  }

  async function retryApuResourceDelete(resource: PartidaRecurso, error: DataError) {
    if (!workspace) {
      return;
    }

    const expectedUpdatedAt = getPersistedUpdatedAt(error);

    if (!expectedUpdatedAt) {
      void loadData();
      return;
    }

    setIsSaving(true);
    setMutationError(null);
    const result = await deletePartidaResource(createBrowserClient(), workspace.scope, resource.id, {
      attempted: null,
      base: resource,
      expectedUpdatedAt
    });
    setIsSaving(false);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    setApuResources((current) => current.filter((item) => item.id !== resource.id));
    if (editingId === resource.id) {
      cancelEdit();
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(baseForm);
    setFormErrors({});
    setMutationError(null);
  }

  if (isLoading) {
    return (
      <AppLayout>
        <ConflictResolutionDialog
          error={conflict?.error || null}
          onDiscard={() => {
            setConflict(null);
            cancelEdit();
            void loadData();
          }}
          onOverwrite={() => {
            const retry = conflict?.retry;
            setConflict(null);
            if (retry) {
              void retry();
            }
          }}
          open={Boolean(conflict)}
        />
        <ActivityToasts
          onDismiss={activity.dismissToast}
          status={activity.status}
          toasts={activity.toasts}
        />
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-5 py-6 lg:px-8">
          <LoadingState label="Cargando APU" rows={5} />
        </div>
      </AppLayout>
    );
  }

  if (loadError || !partida) {
    return (
      <AppLayout>
        <ConflictResolutionDialog
          error={conflict?.error || null}
          onDiscard={() => {
            setConflict(null);
            cancelEdit();
            void loadData();
          }}
          onOverwrite={() => {
            const retry = conflict?.retry;
            setConflict(null);
            if (retry) {
              void retry();
            }
          }}
          open={Boolean(conflict)}
        />
        <ActivityToasts
          onDismiss={activity.dismissToast}
          status={activity.status}
          toasts={activity.toasts}
        />
        <div className="mx-auto flex w-full max-w-[900px] flex-col gap-5 px-5 py-10 lg:px-8">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
            href="/partidas"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a partidas
          </Link>
          <section className="rounded-2xl border border-slate-200 bg-white shadow-soft">
            <EmptyState
              action={
                <Button icon={RefreshCcw} onClick={() => void loadData()} variant="secondary">
                  Reintentar
                </Button>
              }
              description={loadError || "El identificador solicitado no existe."}
              title="Partida no encontrada"
            />
          </section>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ConflictResolutionDialog
        error={conflict?.error || null}
        onDiscard={() => {
          setConflict(null);
          cancelEdit();
          void loadData();
        }}
        onOverwrite={() => {
          const retry = conflict?.retry;
          setConflict(null);
          if (retry) {
            void retry();
          }
        }}
        open={Boolean(conflict)}
      />
      <ActivityToasts
        onDismiss={activity.dismissToast}
        status={activity.status}
        toasts={activity.toasts}
      />
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-5 py-6 lg:px-8">
        <PresenceBar target={presenceTarget} users={presence.users} />
        <PageHeader
          actions={
            <Button disabled={isSaving} icon={RefreshCcw} onClick={() => void loadData()} variant="secondary">
              Recargar
            </Button>
          }
          backLink={{ href: "/partidas", label: "Volver a partidas" }}
          breadcrumbs={[
            { label: "Partidas / APU" },
            { label: partida.codigo || "Sin codigo" },
            { label: "Detalle" }
          ]}
          title={partida.nombre}
        />

        {mutationError ? (
          <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            {mutationError}
          </section>
        ) : null}

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft md:grid-cols-2 xl:grid-cols-4">
          <InfoBlock label="Codigo" value={partida.codigo || "Sin codigo"} />
          <InfoBlock label="Unidad" value={partida.unidad} />
          <InfoBlock label="Categoria" value={partida.categoria || "Sin categoria"} />
          <InfoBlock label="Subcategoria" value={partida.subcategoria || "Sin subcategoria"} />
          <InfoBlock
            label="Rendimiento"
            value={partida.rendimiento ? `${formatNumber(partida.rendimiento)} ${partida.unidad} / jor` : "Sin dato"}
          />
          <InfoBlock label="Jornada" value={`${formatNumber(partida.jornada_horas)} hr/dia`} />
          <InfoBlock label="Desperdicio materiales" value={`${formatNumber(partida.desperdicio_materiales_porcentaje)}%`} />
          <div className="md:col-span-2 xl:col-span-4">
            <p className="text-xs font-bold uppercase text-slate-500">Especificaciones</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {partida.especificaciones || "Sin especificaciones registradas."}
            </p>
          </div>
        </section>

        <section className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="flex min-w-0 flex-col gap-5">
            <ApuResourcesTable
              canMutate={Boolean(workspace?.canMutate)}
              isSubmitting={isSaving}
              onEdit={openEdit}
              onRemove={(resourceId) => void removeResource(resourceId)}
              resourceCatalog={catalogResources}
              resources={apuResources}
            />
          </div>

          <aside className="grid min-w-0 gap-5 xl:grid-cols-2 2xl:flex 2xl:flex-col">
            <ApuSummaryCard
              directTotals={directTotals}
              gastosGenerales={gastosGenerales}
              unitPrice={unitPrice}
              utilidad={utilidad}
            />
            <ApuBuilderPanel
              canMutate={Boolean(workspace?.canMutate)}
              errors={formErrors}
              form={form}
              isEditing={Boolean(editingId)}
              isSubmitting={isSaving}
              onCancelEdit={cancelEdit}
              onChange={handleFormChange}
              onSubmit={() => void handleSubmit()}
              resources={catalogResources.filter((resource) => resource.estado === "activo")}
            />
          </aside>
        </section>
      </div>
    </AppLayout>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}

function errorMessage(error: DataError) {
  if (error.code === "permission") {
    return "No tienes permisos para realizar esta acción.";
  }

  if (error.code === "conflict") {
    return "El APU entra en conflicto con un registro existente. Revisa el orden.";
  }

  return error.message;
}

function getPersistedUpdatedAt(error: DataError) {
  return isOptimisticConflict(error) && "updated_at" in (error.details.persisted as Record<string, unknown>)
    ? String((error.details.persisted as { updated_at: string }).updated_at)
    : undefined;
}
