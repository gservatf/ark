"use client";

import { Boxes, Plus, RefreshCcw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ActivityToasts } from "@/components/shared/ActivityToasts";
import { Button } from "@/components/shared/Button";
import { ConflictResolutionDialog } from "@/components/shared/ConflictResolutionDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PresenceBar } from "@/components/shared/PresenceBar";
import { isOptimisticConflict } from "@/lib/data/conflicts";
import { ConfirmDeactivateDialog } from "@/components/recursos/ConfirmDeactivateDialog";
import {
  ResourceFilters,
  type ResourceFiltersValue
} from "@/components/recursos/ResourceFilters";
import {
  ResourceFormPanel,
  type ResourceFormState
} from "@/components/recursos/ResourceFormPanel";
import { ResourceHistoryPanel } from "@/components/recursos/ResourceHistoryPanel";
import { ResourceMetrics } from "@/components/recursos/ResourceMetrics";
import {
  ResourceQuotesPanel,
  type ResourceQuoteFormState
} from "@/components/recursos/ResourceQuotesPanel";
import { ResourceTable } from "@/components/recursos/ResourceTable";
import { listProviders } from "@/lib/data/providers";
import {
  createResourceQuote,
  deactivateResourceQuote,
  listResourceQuotes,
  updateResourceQuote
} from "@/lib/data/quotes";
import {
  createResource,
  deactivateResource,
  listResourcePriceHistory,
  listResources,
  updateResource
} from "@/lib/data/resources";
import type { DataError, DataScope } from "@/lib/data/types";
import { resolveOrganizationWorkspace } from "@/lib/data/workspace";
import type { ActivityRealtimePayload } from "@/lib/realtime/activity";
import type { PresenceTarget } from "@/lib/realtime/presence";
import { useActivitySubscription } from "@/lib/realtime/useActivitySubscription";
import { usePresenceChannel } from "@/lib/realtime/usePresenceChannel";
import { createBrowserClient } from "@/lib/supabase/browser";
import {
  parseResourceFilters,
  resourceFilterDefaults,
  serializeResourceFilters
} from "@/lib/ui/url-state";
import { validateFormData } from "@/lib/validations/form";
import {
  recursoProveedorPrecioInputSchema,
  type RecursoProveedorPrecioInput
} from "@/lib/validations/quotes";
import { recursoInputSchema, type RecursoInput } from "@/lib/validations/resources";
import type { Proveedor, Recurso, RecursoPrecioHistorial, RecursoProveedorPrecio } from "@/types/domain";

type WorkspaceState = {
  canMutate: boolean;
  scope: DataScope;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: ResourceFormState = {
  costo_transporte: "0",
  costo_unitario_actual: "0",
  especificacion: "",
  estado: "activo",
  fecha_actualizacion_precio: today(),
  fuente_precio: "",
  marca: "",
  nombre: "",
  proveedor_id: "",
  tipo: "material",
  transporte_aplica: false,
  unidad: ""
};

const emptyQuoteForm: ResourceQuoteFormState = {
  costo_transporte: "0",
  costo_unitario: "0",
  es_preferido_interno: false,
  estado: "activo",
  fecha_cotizacion: today(),
  fuente_precio: "",
  proveedor_id: "",
  url_referencia: "",
  vigente_desde: today(),
  vigente_hasta: ""
};

const initialFilters: ResourceFiltersValue = resourceFilterDefaults;

export default function RecursosPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resources, setResources] = useState<Recurso[]>([]);
  const [providers, setProviders] = useState<Proveedor[]>([]);
  const [history, setHistory] = useState<RecursoPrecioHistorial[]>([]);
  const [quotes, setQuotes] = useState<RecursoProveedorPrecio[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [filters, setFilters] = useState<ResourceFiltersValue>(() => parseResourceFilters(searchParams));
  const [form, setForm] = useState<ResourceFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ResourceFormState, string>>>({});
  const [quoteForm, setQuoteForm] = useState<ResourceQuoteFormState>(emptyQuoteForm);
  const [quoteFormErrors, setQuoteFormErrors] = useState<Partial<Record<keyof ResourceQuoteFormState, string>>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>();
  const selectedResourceIdRef = useRef<string | undefined>();
  const [deactivateTarget, setDeactivateTarget] = useState<Recurso | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isQuotesLoading, setIsQuotesLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [conflict, setConflict] = useState<{ error: DataError; retry: () => Promise<void> } | null>(null);

  const loadHistory = useCallback(async (scope: DataScope, resourceId?: string) => {
    if (!resourceId) {
      setHistory([]);
      return;
    }

    setIsHistoryLoading(true);
    const result = await listResourcePriceHistory(createBrowserClient(), scope, resourceId);
    setIsHistoryLoading(false);

    if (result.ok) {
      setHistory(result.data);
    } else {
      setMutationError(errorMessage(result.error));
      setHistory([]);
    }
  }, []);

  const loadQuotes = useCallback(async (scope: DataScope, resourceId?: string) => {
    if (!resourceId) {
      setQuotes([]);
      return;
    }

    setIsQuotesLoading(true);
    const result = await listResourceQuotes(createBrowserClient(), scope, resourceId);
    setIsQuotesLoading(false);

    if (result.ok) {
      setQuotes(result.data);
    } else {
      setMutationError(errorMessage(result.error));
      setQuotes([]);
    }
  }, []);

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

    const nextWorkspace: WorkspaceState = workspaceResult.data;

    const [resourcesResult, providersResult] = await Promise.all([
      listResources(supabase, nextWorkspace.scope),
      listProviders(supabase, nextWorkspace.scope)
    ]);

    if (!resourcesResult.ok) {
      setLoadError(errorMessage(resourcesResult.error));
      setIsLoading(false);
      return;
    }

    if (!providersResult.ok) {
      setLoadError(errorMessage(providersResult.error));
      setIsLoading(false);
      return;
    }

    const currentSelectedId = selectedResourceIdRef.current;
    const nextSelectedId = currentSelectedId && resourcesResult.data.some((resource) => resource.id === currentSelectedId)
      ? currentSelectedId
      : resourcesResult.data[0]?.id;

    setWorkspace(nextWorkspace);
    setResources(resourcesResult.data);
    setProviders(providersResult.data);
    setSelectedResourceId(nextSelectedId);
    setIsLoading(false);
    await Promise.all([
      loadHistory(nextWorkspace.scope, nextSelectedId),
      loadQuotes(nextWorkspace.scope, nextSelectedId)
    ]);
  }, [loadHistory, loadQuotes]);

  useEffect(() => {
    selectedResourceIdRef.current = selectedResourceId;
  }, [selectedResourceId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const nextFilters = parseResourceFilters(searchParams);
    setFilters((current) =>
      resourceFiltersEqual(current, nextFilters) ? current : nextFilters
    );
  }, [searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = serializeResourceFilters(filters, searchParams).toString();
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
    (payload: ActivityRealtimePayload) => ["recurso", "proveedor", "recurso_proveedor_precio"].includes(payload.entityType),
    []
  );
  const activity = useActivitySubscription({
    currentActorId: workspace?.scope.actorId,
    enabled: Boolean(workspace),
    filter: activityFilter,
    onRefetch: loadData,
    topicScope: activityTopic
  });

  const filteredResources = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesQuery = query ? resource.nombre.toLowerCase().includes(query) : true;
      const matchesType = filters.type === "todos" ? true : resource.tipo === filters.type;
      const matchesProvider =
        filters.providerId === "todos" ? true : resource.proveedor_id === filters.providerId;
      const matchesStatus = filters.status === "todos" ? true : resource.estado === filters.status;

      return matchesQuery && matchesType && matchesProvider && matchesStatus;
    });
  }, [filters, resources]);

  const selectedResource = resources.find((resource) => resource.id === selectedResourceId);
  const editingResource = editingId ? resources.find((resource) => resource.id === editingId) : undefined;
  const editingQuote = editingQuoteId ? quotes.find((quote) => quote.id === editingQuoteId) : undefined;
  const presenceTarget: PresenceTarget | null = editingResource
    ? { id: editingResource.id, label: editingResource.nombre, type: "recurso" }
    : selectedResource
      ? { id: selectedResource.id, label: selectedResource.nombre, type: "recurso" }
      : null;
  const presence = usePresenceChannel({
    editing: editingResource ? presenceTarget : editingQuote ? { id: editingQuote.id, label: "cotización", type: "recurso_proveedor_precio" } : null,
    enabled: Boolean(workspace),
    page: "/recursos",
    topicScope: activityTopic,
    viewing: presenceTarget
  });

  function openCreateForm() {
    if (!workspace?.canMutate) {
      setMutationError("Solo administradores de la organización pueden crear recursos.");
      return;
    }

    setEditingId(null);
    setForm({ ...emptyForm, fecha_actualizacion_precio: today() });
    setFormErrors({});
    setMutationError(null);
    setConflict(null);
    setShowForm(true);
  }

  function openCreateQuoteForm() {
    if (!workspace?.canMutate || !selectedResource) {
      setMutationError("Selecciona un recurso y verifica permisos para crear cotizaciones.");
      return;
    }

    setEditingQuoteId(null);
    setQuoteForm({ ...emptyQuoteForm, fecha_cotizacion: today(), vigente_desde: today() });
    setQuoteFormErrors({});
    setMutationError(null);
    setConflict(null);
    setShowQuoteForm(true);
  }

  function openEditQuoteForm(quote: RecursoProveedorPrecio) {
    if (!workspace?.canMutate) {
      setMutationError("Solo administradores de la organización pueden editar cotizaciones.");
      return;
    }

    setEditingQuoteId(quote.id);
    setQuoteForm(formFromQuote(quote));
    setQuoteFormErrors({});
    setMutationError(null);
    setConflict(null);
    setShowQuoteForm(true);
  }

  function openEditForm(resource: Recurso) {
    if (!workspace?.canMutate) {
      setMutationError("Solo administradores de la organización pueden editar recursos.");
      return;
    }

    setEditingId(resource.id);
    void selectResource(resource.id);
    setForm(formFromResource(resource));
    setFormErrors({});
    setMutationError(null);
    setConflict(null);
    setShowForm(true);
  }

  function handleFormChange<Field extends keyof ResourceFormState>(
    field: Field,
    value: ResourceFormState[Field]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "transporte_aplica" && value === false ? { costo_transporte: "0" } : {})
    }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
    setMutationError(null);
  }

  function handleQuoteFormChange<Field extends keyof ResourceQuoteFormState>(
    field: Field,
    value: ResourceQuoteFormState[Field]
  ) {
    setQuoteForm((current) => ({ ...current, [field]: value }));
    setQuoteFormErrors((current) => ({ ...current, [field]: undefined }));
    setMutationError(null);
  }

  async function handleSubmit() {
    if (!workspace) {
      setMutationError("No se encontró una organización activa para guardar el recurso.");
      return;
    }

    if (!workspace.canMutate) {
      setMutationError("Solo administradores de la organización pueden guardar recursos.");
      return;
    }

    const validation = validateFormData<typeof recursoInputSchema, keyof ResourceFormState>(
      recursoInputSchema,
      {
        ...form,
        costo_transporte: form.transporte_aplica ? form.costo_transporte : "0"
      }
    );

    if (Object.keys(validation.errors).length > 0 || !validation.data) {
      setFormErrors(validation.errors);
      return;
    }

    const formData = validation.data;
    setIsSaving(true);
    setMutationError(null);

    const supabase = createBrowserClient();
    const baseResource = editingId ? resources.find((resource) => resource.id === editingId) : undefined;
    const result = editingId
      ? await updateResource(supabase, workspace.scope, editingId, formData, {
          attempted: formData,
          base: baseResource,
          expectedUpdatedAt: baseResource?.updated_at
        })
      : await createResource(supabase, workspace.scope, formData);

    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error) && editingId) {
        setConflict({
          error: result.error,
          retry: () => retryResourceUpdate(editingId, formData, result.error)
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setResources((current) =>
      editingId
        ? current.map((resource) => (resource.id === result.data.id ? result.data : resource))
        : [result.data, ...current]
    );
    setSelectedResourceId(result.data.id);
    await loadHistory(workspace.scope, result.data.id);
    setShowForm(false);
    setEditingId(null);
    setFormErrors({});
  }

  async function handleQuoteSubmit() {
    if (!workspace || !selectedResource) {
      setMutationError("Selecciona un recurso para guardar la cotización.");
      return;
    }

    if (!workspace.canMutate) {
      setMutationError("Solo administradores de la organización pueden guardar cotizaciones.");
      return;
    }

    const validation = validateFormData<typeof recursoProveedorPrecioInputSchema, keyof ResourceQuoteFormState>(
      recursoProveedorPrecioInputSchema,
      {
        ...quoteForm,
        moneda: "PEN",
        recurso_id: selectedResource.id
      }
    );

    if (Object.keys(validation.errors).length > 0 || !validation.data) {
      setQuoteFormErrors(validation.errors);
      return;
    }

    const formData = validation.data;
    setIsSaving(true);
    setMutationError(null);

    const result = editingQuoteId
      ? await updateResourceQuote(createBrowserClient(), workspace.scope, editingQuoteId, formData, {
          attempted: formData,
          base: editingQuote,
          expectedUpdatedAt: editingQuote?.updated_at
        })
      : await createResourceQuote(createBrowserClient(), workspace.scope, formData);

    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error) && editingQuoteId) {
        setConflict({
          error: result.error,
          retry: () => retryQuoteUpdate(editingQuoteId, formData, result.error)
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    await loadQuotes(workspace.scope, selectedResource.id);
    setShowQuoteForm(false);
    setEditingQuoteId(null);
    setQuoteFormErrors({});
  }

  async function handleDeactivateQuote(quote: RecursoProveedorPrecio) {
    if (!workspace) {
      return;
    }

    setIsSaving(true);
    const result = await deactivateResourceQuote(createBrowserClient(), workspace.scope, quote.id, {
      attempted: { es_preferido_interno: false, estado: "inactivo" },
      base: quote,
      expectedUpdatedAt: quote.updated_at
    });
    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error)) {
        setConflict({
          error: result.error,
          retry: () => retryQuoteDeactivate(quote, result.error)
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    await loadQuotes(workspace.scope, quote.recurso_id);
  }

  async function confirmDeactivate() {
    if (!deactivateTarget || !workspace) {
      return;
    }

    if (!workspace.canMutate) {
      setMutationError("Solo administradores de la organización pueden desactivar recursos.");
      setDeactivateTarget(undefined);
      return;
    }

    setIsSaving(true);
    setMutationError(null);

    const result = await deactivateResource(createBrowserClient(), workspace.scope, deactivateTarget.id, {
      attempted: { estado: "inactivo" },
      base: deactivateTarget,
      expectedUpdatedAt: deactivateTarget.updated_at
    });

    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error)) {
        setConflict({
          error: result.error,
          retry: () => retryResourceDeactivate(deactivateTarget, result.error)
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setResources((current) =>
      current.map((resource) => (resource.id === result.data.id ? result.data : resource))
    );
    setSelectedResourceId(result.data.id);
    setDeactivateTarget(undefined);
  }

  async function retryResourceUpdate(resourceId: string, input: RecursoInput, error: DataError) {
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
    const result = await updateResource(createBrowserClient(), workspace.scope, resourceId, input, {
      attempted: input,
      expectedUpdatedAt
    });
    setIsSaving(false);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    setResources((current) => current.map((resource) => (resource.id === result.data.id ? result.data : resource)));
    setSelectedResourceId(result.data.id);
    await loadHistory(workspace.scope, result.data.id);
    setShowForm(false);
    setEditingId(null);
    setFormErrors({});
  }

  async function retryResourceDeactivate(resource: Recurso, error: DataError) {
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
    const result = await deactivateResource(createBrowserClient(), workspace.scope, resource.id, {
      attempted: { estado: "inactivo" },
      base: resource,
      expectedUpdatedAt
    });
    setIsSaving(false);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    setResources((current) => current.map((item) => (item.id === result.data.id ? result.data : item)));
    setSelectedResourceId(result.data.id);
    setDeactivateTarget(undefined);
  }

  async function retryQuoteUpdate(quoteId: string, input: RecursoProveedorPrecioInput, error: DataError) {
    if (!workspace || !selectedResource) {
      return;
    }

    const expectedUpdatedAt = getPersistedUpdatedAt(error);

    if (!expectedUpdatedAt) {
      void loadData();
      return;
    }

    setIsSaving(true);
    setMutationError(null);
    const result = await updateResourceQuote(createBrowserClient(), workspace.scope, quoteId, input, {
      attempted: input,
      expectedUpdatedAt
    });
    setIsSaving(false);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    await loadQuotes(workspace.scope, selectedResource.id);
    setShowQuoteForm(false);
    setEditingQuoteId(null);
    setQuoteFormErrors({});
  }

  async function retryQuoteDeactivate(quote: RecursoProveedorPrecio, error: DataError) {
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
    const result = await deactivateResourceQuote(createBrowserClient(), workspace.scope, quote.id, {
      attempted: { es_preferido_interno: false, estado: "inactivo" },
      base: quote,
      expectedUpdatedAt
    });
    setIsSaving(false);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    await loadQuotes(workspace.scope, quote.recurso_id);
  }

  async function selectResource(resourceId: string) {
    setSelectedResourceId(resourceId);

    if (workspace) {
      await Promise.all([
        loadHistory(workspace.scope, resourceId),
        loadQuotes(workspace.scope, resourceId)
      ]);
    }
  }

  return (
    <AppLayout>
      <ConflictResolutionDialog
        error={conflict?.error || null}
        onDiscard={() => {
          setConflict(null);
          setShowForm(false);
          setShowQuoteForm(false);
          setEditingId(null);
          setEditingQuoteId(null);
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
                onClick={() => void loadData()}
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
                    ? "Crear recurso"
                    : "Solo administradores pueden crear recursos"
                }
              >
                Nuevo recurso
              </Button>
            </>
          }
          breadcrumbs={[{ label: "Base de datos" }, { label: "Recursos" }]}
          title="Recursos"
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
          <LoadingState label="Cargando recursos" rows={5} />
        ) : loadError ? (
          <EmptyState
            action={
              <Button icon={RefreshCcw} onClick={() => void loadData()} variant="secondary">
                Reintentar
              </Button>
            }
            description="Verifica la sesión y la organización activa antes de volver a intentar."
            icon={Boxes}
            title="No se pudo cargar recursos"
          />
        ) : (
          <>
            <ResourceMetrics
              history={history}
              providerCount={providers.length}
              resources={resources}
            />

            <ResourceFilters
              filters={filters}
              onChange={setFilters}
              providers={providers}
              resultCount={filteredResources.length}
            />

            <section className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_390px]">
              <div className="flex min-w-0 flex-col gap-5">
                <ResourceTable
                  canMutate={Boolean(workspace?.canMutate)}
                  onDeactivate={setDeactivateTarget}
                  onEdit={openEditForm}
                  onSelect={(resource) => void selectResource(resource.id)}
                  providers={providers}
                  resources={filteredResources}
                  selectedResourceId={selectedResourceId}
                />

                {showForm ? (
                  <ResourceFormPanel
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
                    providers={providers}
                  />
                ) : null}
              </div>

              <aside className="min-w-0">
                {isHistoryLoading ? (
                  <LoadingState label="Cargando historial" rows={3} />
                ) : (
                  <div className="grid gap-5">
                    <ResourceQuotesPanel
                      canMutate={Boolean(workspace?.canMutate)}
                      errors={quoteFormErrors}
                      form={quoteForm}
                      isEditing={Boolean(editingQuoteId)}
                      isLoading={isQuotesLoading}
                      isSubmitting={isSaving}
                      onCancel={() => {
                        setShowQuoteForm(false);
                        setEditingQuoteId(null);
                        setQuoteFormErrors({});
                      }}
                      onChange={handleQuoteFormChange}
                      onDeactivate={(quote) => void handleDeactivateQuote(quote)}
                      onEdit={openEditQuoteForm}
                      onOpenCreate={openCreateQuoteForm}
                      onSubmit={() => void handleQuoteSubmit()}
                      providers={providers}
                      quotes={quotes}
                      resource={selectedResource}
                      showForm={showQuoteForm}
                    />
                    <ResourceHistoryPanel
                      history={history}
                      providers={providers}
                      resource={selectedResource}
                    />
                  </div>
                )}
              </aside>
            </section>
          </>
        )}
      </div>

      <ConfirmDeactivateDialog
        onCancel={() => setDeactivateTarget(undefined)}
        onConfirm={confirmDeactivate}
        resource={deactivateTarget}
      />
    </AppLayout>
  );
}

function formFromResource(resource: Recurso): ResourceFormState {
  return {
    costo_transporte: String(resource.costo_transporte),
    costo_unitario_actual: String(resource.costo_unitario_actual),
    especificacion: resource.especificacion || "",
    estado: resource.estado,
    fecha_actualizacion_precio: resource.fecha_actualizacion_precio || today(),
    fuente_precio: resource.fuente_precio || "",
    marca: resource.marca || "",
    nombre: resource.nombre,
    proveedor_id: resource.proveedor_id || "",
    tipo: resource.tipo,
    transporte_aplica: resource.transporte_aplica,
    unidad: resource.unidad
  };
}

function getPersistedUpdatedAt(error: DataError) {
  return isOptimisticConflict(error) && "updated_at" in (error.details.persisted as Record<string, unknown>)
    ? String((error.details.persisted as { updated_at: string }).updated_at)
    : undefined;
}

function resourceFiltersEqual(first: ResourceFiltersValue, second: ResourceFiltersValue) {
  return (
    first.providerId === second.providerId &&
    first.query === second.query &&
    first.status === second.status &&
    first.type === second.type
  );
}

function formFromQuote(quote: RecursoProveedorPrecio): ResourceQuoteFormState {
  return {
    costo_transporte: String(quote.costo_transporte),
    costo_unitario: String(quote.costo_unitario),
    es_preferido_interno: quote.es_preferido_interno,
    estado: quote.estado,
    fecha_cotizacion: quote.fecha_cotizacion || today(),
    fuente_precio: quote.fuente_precio || "",
    proveedor_id: quote.proveedor_id,
    url_referencia: quote.url_referencia || "",
    vigente_desde: quote.vigente_desde || "",
    vigente_hasta: quote.vigente_hasta || ""
  };
}

function errorMessage(error: DataError) {
  if (error.code === "permission") {
    return "No tienes permisos para realizar esta acción.";
  }

  if (error.code === "conflict") {
    return "El recurso entra en conflicto con un registro existente.";
  }

  return error.message;
}
