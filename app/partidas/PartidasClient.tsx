"use client";

import { Boxes, Plus, RefreshCcw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { ConfirmDeactivatePartidaDialog } from "@/components/partidas/ConfirmDeactivatePartidaDialog";
import {
  PartidaFilters,
  type PartidaFiltersValue
} from "@/components/partidas/PartidaFilters";
import {
  PartidaFormPanel,
  type PartidaFormState
} from "@/components/partidas/PartidaFormPanel";
import { PartidaMetrics } from "@/components/partidas/PartidaMetrics";
import { PartidaTable } from "@/components/partidas/PartidaTable";
import { ActivityToasts } from "@/components/shared/ActivityToasts";
import { Button } from "@/components/shared/Button";
import { ConflictResolutionDialog } from "@/components/shared/ConflictResolutionDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PresenceBar } from "@/components/shared/PresenceBar";
import { isOptimisticConflict } from "@/lib/data/conflicts";
import {
  createPartida,
  deactivatePartida,
  listOrganizationPartidaResources,
  listPartidas,
  updatePartida
} from "@/lib/data/items";
import type { DataError, DataScope } from "@/lib/data/types";
import { canManageOrganizationCatalog, resolveOrganizationWorkspace } from "@/lib/data/workspace";
import type { ActivityRealtimePayload } from "@/lib/realtime/activity";
import type { PresenceTarget } from "@/lib/realtime/presence";
import { useActivitySubscription } from "@/lib/realtime/useActivitySubscription";
import { usePresenceChannel } from "@/lib/realtime/usePresenceChannel";
import { createBrowserClient } from "@/lib/supabase/browser";
import {
  parsePartidaFilters,
  partidaFilterDefaults,
  serializePartidaFilters
} from "@/lib/ui/url-state";
import { partidaInputSchema, type PartidaInput } from "@/lib/validations/items";
import type { Partida, PartidaRecurso } from "@/types/domain";

type WorkspaceState = {
  canMutate: boolean;
  scope: DataScope;
};

const emptyForm: PartidaFormState = {
  categoria: "",
  codigo: "",
  cuadrilla: "",
  descripcion: "",
  especificaciones: "",
  estado: "activo",
  nombre: "",
  rendimiento: "",
  unidad: ""
};

const initialFilters: PartidaFiltersValue = partidaFilterDefaults;

export default function PartidasPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [apuResources, setApuResources] = useState<PartidaRecurso[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [filters, setFilters] = useState<PartidaFiltersValue>(() => parsePartidaFilters(searchParams));
  const [form, setForm] = useState<PartidaFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PartidaFormState, string>>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Partida | undefined>();
  const [showForm, setShowForm] = useState(false);
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

    const [partidasResult, resourcesResult] = await Promise.all([
      listPartidas(supabase, nextWorkspace.scope),
      listOrganizationPartidaResources(supabase, nextWorkspace.scope)
    ]);

    if (!partidasResult.ok) {
      setLoadError(errorMessage(partidasResult.error));
      setIsLoading(false);
      return;
    }

    if (!resourcesResult.ok) {
      setLoadError(errorMessage(resourcesResult.error));
      setIsLoading(false);
      return;
    }

    setWorkspace(nextWorkspace);
    setPartidas(partidasResult.data);
    setApuResources(resourcesResult.data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const nextFilters = parsePartidaFilters(searchParams);
    setFilters((current) =>
      partidaFiltersEqual(current, nextFilters) ? current : nextFilters
    );
  }, [searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = serializePartidaFilters(filters, searchParams).toString();
      const currentSearch = searchParams.toString();

      if (nextSearch !== currentSearch) {
        router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, { scroll: false });
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [filters, pathname, router, searchParams]);

  const activityTopic = useMemo(
    () => (workspace ? { organizacionId: workspace.scope.organizacionId, type: "org" as const } : undefined),
    [workspace]
  );
  const activityFilter = useCallback(
    (payload: ActivityRealtimePayload) => ["partida", "partida_recurso", "recurso"].includes(payload.entityType),
    []
  );
  const activity = useActivitySubscription({
    currentActorId: workspace?.scope.actorId,
    enabled: Boolean(workspace),
    filter: activityFilter,
    onRefetch: loadData,
    topicScope: activityTopic
  });
  const editingPartida = editingId ? partidas.find((partida) => partida.id === editingId) : undefined;
  const presenceTarget: PresenceTarget | null = editingPartida
    ? { id: editingPartida.id, label: editingPartida.nombre, type: "partida" }
    : null;
  const presence = usePresenceChannel({
    editing: presenceTarget,
    enabled: Boolean(workspace),
    page: "/partidas",
    topicScope: activityTopic,
    viewing: presenceTarget
  });

  const categories = useMemo(
    () =>
      Array.from(
        new Set(partidas.map((partida) => partida.categoria).filter(Boolean) as string[])
      ).sort((a, b) => a.localeCompare(b)),
    [partidas]
  );

  const filteredPartidas = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return partidas.filter((partida) => {
      const searchable = `${partida.codigo} ${partida.nombre}`.toLowerCase();
      const matchesQuery = query ? searchable.includes(query) : true;
      const matchesCategory =
        filters.category === "todas" ? true : partida.categoria === filters.category;
      const matchesStatus = filters.status === "todos" ? true : partida.estado === filters.status;

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [filters, partidas]);

  function openCreateForm() {
    if (!workspace?.canMutate) {
      setMutationError("Solo admins de proyecto u organización pueden crear partidas.");
      return;
    }

    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setMutationError(null);
    setConflict(null);
    setShowForm(true);
  }

  function openEditForm(partida: Partida) {
    if (!workspace?.canMutate) {
      setMutationError("Solo admins de proyecto u organización pueden editar partidas.");
      return;
    }

    setEditingId(partida.id);
    setForm(formFromPartida(partida));
    setFormErrors({});
    setMutationError(null);
    setConflict(null);
    setShowForm(true);
  }

  function handleFormChange<Field extends keyof PartidaFormState>(
    field: Field,
    value: PartidaFormState[Field]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
    setMutationError(null);
  }

  async function handleSubmit() {
    if (!workspace) {
      setMutationError("No se encontró una organización activa para guardar la partida.");
      return;
    }

    if (!workspace.canMutate) {
      setMutationError("Solo admins de proyecto u organización pueden guardar partidas.");
      return;
    }

    const validation = validateForm(form);

    if (Object.keys(validation.errors).length > 0 || !validation.data) {
      setFormErrors(validation.errors);
      return;
    }

    const formData = validation.data;
    setIsSaving(true);
    setMutationError(null);

    const basePartida = editingId ? partidas.find((partida) => partida.id === editingId) : undefined;
    const result = editingId
      ? await updatePartida(createBrowserClient(), workspace.scope, editingId, formData, {
          attempted: formData,
          base: basePartida,
          expectedUpdatedAt: basePartida?.updated_at
        })
      : await createPartida(createBrowserClient(), workspace.scope, formData);

    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error) && editingId) {
        setConflict({
          error: result.error,
          retry: () => retryPartidaUpdate(editingId, formData, result.error)
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setPartidas((current) =>
      editingId
        ? current.map((partida) => (partida.id === result.data.id ? result.data : partida))
        : [result.data, ...current]
    );
    setShowForm(false);
    setEditingId(null);
    setFormErrors({});
  }

  async function confirmDeactivate() {
    if (!deactivateTarget || !workspace) {
      return;
    }

    setIsSaving(true);
    setMutationError(null);

    const result = await deactivatePartida(createBrowserClient(), workspace.scope, deactivateTarget.id, {
      attempted: { estado: "inactivo" },
      base: deactivateTarget,
      expectedUpdatedAt: deactivateTarget.updated_at
    });

    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error)) {
        setConflict({
          error: result.error,
          retry: () => retryPartidaDeactivate(deactivateTarget, result.error)
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setPartidas((current) =>
      current.map((partida) => (partida.id === result.data.id ? result.data : partida))
    );
    setDeactivateTarget(undefined);
  }

  async function retryPartidaUpdate(partidaId: string, input: PartidaInput, error: DataError) {
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
    const result = await updatePartida(createBrowserClient(), workspace.scope, partidaId, input, {
      attempted: input,
      expectedUpdatedAt
    });
    setIsSaving(false);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    setPartidas((current) => current.map((partida) => (partida.id === result.data.id ? result.data : partida)));
    setShowForm(false);
    setEditingId(null);
    setFormErrors({});
  }

  async function retryPartidaDeactivate(partida: Partida, error: DataError) {
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
    const result = await deactivatePartida(createBrowserClient(), workspace.scope, partida.id, {
      attempted: { estado: "inactivo" },
      base: partida,
      expectedUpdatedAt
    });
    setIsSaving(false);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    setPartidas((current) => current.map((item) => (item.id === result.data.id ? result.data : item)));
    setDeactivateTarget(undefined);
  }

  return (
    <AppLayout>
      <ConflictResolutionDialog
        error={conflict?.error || null}
        onDiscard={() => {
          setConflict(null);
          setShowForm(false);
          setEditingId(null);
          setDeactivateTarget(undefined);
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
            <>
              <Button
                disabled={isLoading}
                icon={RefreshCcw}
                onClick={() => {
                  setFilters(initialFilters);
                  void loadData();
                }}
                variant="secondary"
              >
                Recargar
              </Button>
              <Button
                disabled={isLoading || !workspace?.canMutate}
                icon={Plus}
                onClick={openCreateForm}
                title={
                  workspace?.canMutate
                    ? "Crear partida"
                    : "Solo admins de proyecto u organización pueden crear partidas"
                }
              >
                Nueva partida
              </Button>
            </>
          }
          breadcrumbs={[{ label: "Base de datos" }, { label: "Partidas" }]}
          title="Partidas / APU"
        />

        {loadError ? (
          <section className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            {loadError}
          </section>
        ) : null}

        {mutationError ? (
          <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            {mutationError}
          </section>
        ) : null}

        {isLoading ? (
          <LoadingState label="Cargando partidas" rows={5} />
        ) : loadError ? (
          <EmptyState
            action={
              <Button icon={RefreshCcw} onClick={() => void loadData()} variant="secondary">
                Reintentar
              </Button>
            }
            description="Verifica la sesión y la organización activa antes de volver a intentar."
            icon={Boxes}
            title="No se pudo cargar partidas"
          />
        ) : (
          <>
            <PartidaMetrics partidas={partidas} resources={apuResources} />

            <PartidaFilters
              categories={categories}
              filters={filters}
              onChange={setFilters}
              resultCount={filteredPartidas.length}
            />

            <PartidaTable
              canMutate={Boolean(workspace?.canMutate)}
              onDeactivate={setDeactivateTarget}
              onEdit={openEditForm}
              partidas={filteredPartidas}
              resources={apuResources}
            />

            {showForm ? (
              <PartidaFormPanel
                errors={formErrors}
                form={form}
                isEditing={Boolean(editingId)}
                isSubmitting={isSaving}
                onCancel={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormErrors({});
                  setMutationError(null);
                }}
                onChange={handleFormChange}
                onSubmit={handleSubmit}
              />
            ) : null}
          </>
        )}
      </div>

      <ConfirmDeactivatePartidaDialog
        onCancel={() => setDeactivateTarget(undefined)}
        onConfirm={confirmDeactivate}
        partida={deactivateTarget}
      />
    </AppLayout>
  );
}

function formFromPartida(partida: Partida): PartidaFormState {
  return {
    categoria: partida.categoria || "",
    codigo: partida.codigo,
    cuadrilla: partida.cuadrilla || "",
    descripcion: partida.descripcion || "",
    especificaciones: partida.especificaciones || "",
    estado: partida.estado,
    nombre: partida.nombre,
    rendimiento: partida.rendimiento === null || partida.rendimiento === undefined ? "" : String(partida.rendimiento),
    unidad: partida.unidad
  };
}

function partidaFiltersEqual(first: PartidaFiltersValue, second: PartidaFiltersValue) {
  return (
    first.category === second.category &&
    first.query === second.query &&
    first.status === second.status
  );
}

function getPersistedUpdatedAt(error: DataError) {
  return isOptimisticConflict(error) && "updated_at" in (error.details.persisted as Record<string, unknown>)
    ? String((error.details.persisted as { updated_at: string }).updated_at)
    : undefined;
}

function validateForm(form: PartidaFormState): {
  data?: PartidaInput;
  errors: Partial<Record<keyof PartidaFormState, string>>;
} {
  const parsed = partidaInputSchema.safeParse({
    ...form,
    rendimiento: form.rendimiento.trim() ? form.rendimiento : null
  });

  if (parsed.success) {
    return { data: parsed.data, errors: {} };
  }

  const flattened = parsed.error.flatten().fieldErrors;
  const errors: Partial<Record<keyof PartidaFormState, string>> = {};

  Object.entries(flattened).forEach(([field, messages]) => {
    if (messages?.[0]) {
      errors[field as keyof PartidaFormState] = messages[0];
    }
  });

  return { errors };
}

function errorMessage(error: DataError) {
  if (error.code === "permission") {
    return "No tienes permisos para realizar esta acción.";
  }

  if (error.code === "conflict") {
    return "Ya existe una partida con ese código en la organización.";
  }

  return error.message;
}
