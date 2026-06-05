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
  type ApuDraftResource,
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
import { createDataBrowserClient } from "@/lib/data/browser-client";
import { isOptimisticConflict } from "@/lib/data/conflicts";
import {
  createPartida,
  createPartidaResource,
  createPartidaWithResources,
  deactivatePartida,
  deletePartidaResource,
  listOrganizationPartidaResources,
  listPartidas,
  updatePartida,
  updatePartidaResource
} from "@/lib/data/items";
import {
  createPartidaCategoria,
  createPartidaSubcategoria,
  createUnidadMedida,
  listPartidaCatalogs,
  updateUnidadMedida,
  type PartidaCatalogs
} from "@/lib/data/partida-catalogs";
import { listResources } from "@/lib/data/resources";
import type { DataClient, DataError, DataScope } from "@/lib/data/types";
import { canManageOrganizationCatalog, resolveOrganizationWorkspace } from "@/lib/data/workspace";
import type { ActivityRealtimePayload } from "@/lib/realtime/activity";
import type { PresenceTarget } from "@/lib/realtime/presence";
import { useActivitySubscription } from "@/lib/realtime/useActivitySubscription";
import { usePresenceChannel } from "@/lib/realtime/usePresenceChannel";
import {
  parsePartidaFilters,
  partidaFilterDefaults,
  serializePartidaFilters
} from "@/lib/ui/url-state";
import { partidaInputSchema, type PartidaApuResourceFormInput, type PartidaInput } from "@/lib/validations/items";
import type { Partida, PartidaCategoria, PartidaRecurso, PartidaSubcategoria, Recurso, UnidadMedida } from "@/types/domain";

type WorkspaceState = {
  canMutate: boolean;
  scope: DataScope;
};

type ApuResourceSyncResult =
  | { data: PartidaRecurso[]; ok: true }
  | { error: DataError; ok: false };

const emptyForm: PartidaFormState = {
  categoria: "",
  categoria_id: "",
  codigo: "",
  desperdicio_materiales_porcentaje: "5",
  especificaciones: "",
  jornada_horas: "8",
  nombre: "",
  rendimiento: "",
  subcategoria: "",
  subcategoria_id: "",
  unidad_id: "",
  unidad: ""
};

const emptyCatalogs: PartidaCatalogs = {
  categorias: [],
  subcategorias: [],
  unidades: []
};

const initialFilters: PartidaFiltersValue = partidaFilterDefaults;

export default function PartidasPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [apuResources, setApuResources] = useState<PartidaRecurso[]>([]);
  const [catalogResources, setCatalogResources] = useState<Recurso[]>([]);
  const [partidaCatalogs, setPartidaCatalogs] = useState<PartidaCatalogs>(emptyCatalogs);
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

    const supabase = createDataBrowserClient();
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

    const [partidasResult, resourcesResult, catalogResult, partidaCatalogsResult] = await Promise.all([
      listPartidas(supabase, nextWorkspace.scope),
      listOrganizationPartidaResources(supabase, nextWorkspace.scope),
      listResources(supabase, nextWorkspace.scope),
      listPartidaCatalogs(supabase, nextWorkspace.scope)
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

    if (!catalogResult.ok) {
      setLoadError(errorMessage(catalogResult.error));
      setIsLoading(false);
      return;
    }

    if (!partidaCatalogsResult.ok) {
      setLoadError(errorMessage(partidaCatalogsResult.error));
      setIsLoading(false);
      return;
    }

    setWorkspace(nextWorkspace);
    setPartidas(partidasResult.data);
    setApuResources(resourcesResult.data);
    setCatalogResources(catalogResult.data);
    setPartidaCatalogs(partidaCatalogsResult.data);
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
    (payload: ActivityRealtimePayload) =>
      [
        "partida",
        "partida_categoria",
        "partida_recurso",
        "partida_subcategoria",
        "recurso",
        "unidad_medida"
      ].includes(payload.entityType),
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
  const editingApuResources = useMemo(
    () =>
      editingId
        ? apuResources
            .filter((resource) => resource.partida_id === editingId)
            .sort((first, second) => first.orden - second.orden)
        : [],
    [apuResources, editingId]
  );
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
        new Set(
          [
            ...partidaCatalogs.categorias.map((categoria) => categoria.nombre),
            ...partidas.map((partida) => partida.categoria).filter(Boolean)
          ] as string[]
        )
      ).sort((a, b) => a.localeCompare(b)),
    [partidaCatalogs.categorias, partidas]
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

  function handleFormPatch(values: Partial<PartidaFormState>) {
    setForm((current) => ({ ...current, ...values }));
    setFormErrors((current) => {
      const nextErrors = { ...current };

      Object.keys(values).forEach((key) => {
        nextErrors[key as keyof PartidaFormState] = undefined;
      });

      return nextErrors;
    });
    setMutationError(null);
  }

  async function handleCreateCategoria(nombre: string): Promise<PartidaCategoria | null> {
    if (!workspace) {
      setMutationError("No se encontro una organizacion activa para crear la categoria.");
      return null;
    }

    const result = await createPartidaCategoria(createDataBrowserClient(), workspace.scope, { nombre });

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return null;
    }

    setPartidaCatalogs((current) => ({
      ...current,
      categorias: [...current.categorias, result.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
    }));
    setMutationError(null);
    return result.data;
  }

  async function handleCreateSubcategoria(categoriaId: string, nombre: string): Promise<PartidaSubcategoria | null> {
    if (!workspace) {
      setMutationError("No se encontro una organizacion activa para crear la subcategoria.");
      return null;
    }

    const result = await createPartidaSubcategoria(createDataBrowserClient(), workspace.scope, {
      categoria_id: categoriaId,
      nombre
    });

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return null;
    }

    setPartidaCatalogs((current) => ({
      ...current,
      subcategorias: [...current.subcategorias, result.data].sort((a, b) => a.nombre.localeCompare(b.nombre))
    }));
    setMutationError(null);
    return result.data;
  }

  async function handleCreateUnidad(codigo: string): Promise<UnidadMedida | null> {
    if (!workspace) {
      setMutationError("No se encontro una organizacion activa para crear la unidad.");
      return null;
    }

    const trimmedCode = codigo.trim();
    const result = await createUnidadMedida(createDataBrowserClient(), workspace.scope, {
      codigo: trimmedCode,
      nombre: trimmedCode
    });

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return null;
    }

    setPartidaCatalogs((current) => ({
      ...current,
      unidades: [...current.unidades, result.data].sort((a, b) => a.codigo.localeCompare(b.codigo))
    }));
    setMutationError(null);
    return result.data;
  }

  async function handleUpdateUnidad(unidadId: string, values: { codigo: string; nombre: string }): Promise<UnidadMedida | null> {
    if (!workspace) {
      setMutationError("No se encontro una organizacion activa para editar la unidad.");
      return null;
    }

    const result = await updateUnidadMedida(createDataBrowserClient(), workspace.scope, unidadId, values);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return null;
    }

    setPartidaCatalogs((current) => ({
      ...current,
      unidades: current.unidades
        .map((unidad) => (unidad.id === result.data.id ? result.data : unidad))
        .sort((a, b) => a.codigo.localeCompare(b.codigo))
    }));
    setMutationError(null);
    return result.data;
  }

  async function syncPartidaApuResources(
    client: DataClient,
    partidaId: string,
    resources: ApuDraftResource[]
  ): Promise<ApuResourceSyncResult> {
    if (!workspace) {
      return {
        error: {
          code: "permission",
          message: "No se encontro una organizacion activa para guardar el APU."
        },
        ok: false
      };
    }

    const existingResources = apuResources.filter((resource) => resource.partida_id === partidaId);
    const submittedIds = new Set(
      resources
        .map((resource) => resource.persistedId)
        .filter((id): id is string => Boolean(id))
    );
    const syncedResources: PartidaRecurso[] = [];

    for (const existing of existingResources) {
      if (!submittedIds.has(existing.id)) {
        const deleteResult = await deletePartidaResource(client, workspace.scope, existing.id, {
          base: existing,
          expectedUpdatedAt: existing.updated_at
        });

        if (!deleteResult.ok) {
          return deleteResult;
        }
      }
    }

    for (let index = 0; index < resources.length; index += 1) {
      const resource = resources[index];
      const input = draftResourceToInput(resource, partidaId, index);
      const baseResource = resource.persistedId
        ? existingResources.find((existing) => existing.id === resource.persistedId)
        : undefined;

      const result = resource.persistedId
        ? await updatePartidaResource(client, workspace.scope, resource.persistedId, input, {
            attempted: input,
            base: baseResource,
            expectedUpdatedAt: baseResource?.updated_at
          })
        : await createPartidaResource(client, workspace.scope, input);

      if (!result.ok) {
        return result;
      }

      syncedResources.push(result.data);
    }

    return {
      data: syncedResources.sort((first, second) => first.orden - second.orden),
      ok: true
    };
  }

  async function handleSubmit(resources: ApuDraftResource[] = [], createAnother = false) {
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
    const client = createDataBrowserClient();

    if (editingId) {
      const partidaResult = await updatePartida(client, workspace.scope, editingId, formData, {
          attempted: formData,
          base: basePartida,
          expectedUpdatedAt: basePartida?.updated_at
        });

      if (!partidaResult.ok) {
        setIsSaving(false);
        if (isOptimisticConflict(partidaResult.error)) {
          setConflict({
            error: partidaResult.error,
            retry: () => retryPartidaUpdate(editingId, formData, partidaResult.error)
          });
        }
        setMutationError(errorMessage(partidaResult.error));
        return;
      }

      const resourcesResult = await syncPartidaApuResources(client, editingId, resources);
      setIsSaving(false);

      if (!resourcesResult.ok) {
        setMutationError(errorMessage(resourcesResult.error));
        return;
      }

      setPartidas((current) =>
        current.map((partida) => (partida.id === partidaResult.data.id ? partidaResult.data : partida))
      );
      setApuResources((current) =>
        [
          ...current.filter((resource) => resource.partida_id !== editingId),
          ...resourcesResult.data
        ].sort((first, second) => first.orden - second.orden)
      );
      setShowForm(false);
      setEditingId(null);
      setFormErrors({});
      return;
    }

    const result = resources.length > 0
      ? await createPartidaWithResources(client, workspace.scope, {
          partida: formData,
          resources: resources.map((resource, index) => draftResourceToInput(resource, "", index))
        })
      : await createPartida(client, workspace.scope, formData);

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

    const savedPartida = "partida" in result.data ? result.data.partida : result.data;
    const savedResources = "resources" in result.data ? result.data.resources : [];

    setPartidas((current) =>
      editingId
        ? current.map((partida) => (partida.id === savedPartida.id ? savedPartida : partida))
        : [savedPartida, ...current]
    );
    if (savedResources.length > 0) {
      setApuResources((current) => [...current, ...savedResources]);
    }
    setShowForm(createAnother);
    setEditingId(null);
    if (createAnother) {
      setForm(emptyForm);
    }
    setFormErrors({});
  }

  async function confirmDeactivate() {
    if (!deactivateTarget || !workspace) {
      return;
    }

    setIsSaving(true);
    setMutationError(null);

    const result = await deactivatePartida(createDataBrowserClient(), workspace.scope, deactivateTarget.id, {
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
    const result = await updatePartida(createDataBrowserClient(), workspace.scope, partidaId, input, {
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
    const result = await deactivatePartida(createDataBrowserClient(), workspace.scope, partida.id, {
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
                catalogs={partidaCatalogs}
                errors={formErrors}
                form={form}
                initialApuResources={editingApuResources}
                isEditing={Boolean(editingId)}
                isSubmitting={isSaving}
                onCreateCategoria={handleCreateCategoria}
                onCreateSubcategoria={handleCreateSubcategoria}
                onCreateUnidad={handleCreateUnidad}
                onUpdateUnidad={handleUpdateUnidad}
                onCancel={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormErrors({});
                  setMutationError(null);
                }}
                onChange={handleFormChange}
                onPatch={handleFormPatch}
                onSubmit={handleSubmit}
                resourceCatalog={catalogResources}
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
    categoria_id: partida.categoria_id || "",
    codigo: partida.codigo || "",
    desperdicio_materiales_porcentaje: String(partida.desperdicio_materiales_porcentaje ?? 5),
    especificaciones: partida.especificaciones || "",
    jornada_horas: String(partida.jornada_horas ?? 8),
    nombre: partida.nombre,
    rendimiento: partida.rendimiento === null || partida.rendimiento === undefined ? "" : String(partida.rendimiento),
    subcategoria: partida.subcategoria || "",
    subcategoria_id: partida.subcategoria_id || "",
    unidad_id: partida.unidad_id || "",
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
    estado: "activo",
    rendimiento: form.rendimiento.trim() ? form.rendimiento : undefined
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

function draftResourceToInput(
  resource: ApuDraftResource,
  partidaId: string,
  index: number
): PartidaApuResourceFormInput {
  return {
    cantidad_base: numberOrNull(resource.cantidad_base),
    cuadrilla: numberOrNull(resource.cuadrilla),
    grupo: resource.grupo,
    orden: index + 1,
    partida_id: partidaId,
    porcentaje_aplicado: numberOrNull(resource.porcentaje_aplicado),
    recurso_id: resource.recurso_id,
    tipo_calculo_apu: resource.tipo_calculo_apu
  };
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

function numberOrNull(value: string) {
  return value.trim() ? Number(value) : null;
}
