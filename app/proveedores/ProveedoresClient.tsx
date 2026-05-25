"use client";

import { Plus, RefreshCcw, WalletCards } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConfirmDeleteProviderDialog } from "@/components/proveedores/ConfirmDeleteProviderDialog";
import { ConfirmProviderStatusDialog } from "@/components/proveedores/ConfirmProviderStatusDialog";
import {
  ProviderFilters,
  type ProviderFiltersValue
} from "@/components/proveedores/ProviderFilters";
import {
  ProviderFormPanel,
  type ProviderFormState
} from "@/components/proveedores/ProviderFormPanel";
import { ProviderMetrics } from "@/components/proveedores/ProviderMetrics";
import { ProviderTable } from "@/components/proveedores/ProviderTable";
import { ActivityToasts } from "@/components/shared/ActivityToasts";
import { Button } from "@/components/shared/Button";
import { ConflictResolutionDialog } from "@/components/shared/ConflictResolutionDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PresenceBar } from "@/components/shared/PresenceBar";
import { isOptimisticConflict } from "@/lib/data/conflicts";
import {
  activateProvider,
  createProvider,
  deactivateProvider,
  deleteProvider,
  listProviders,
  updateProvider
} from "@/lib/data/providers";
import type { DataError, DataScope } from "@/lib/data/types";
import { canManageOrganizationCatalog, resolveOrganizationWorkspace } from "@/lib/data/workspace";
import type { ActivityRealtimePayload } from "@/lib/realtime/activity";
import type { PresenceTarget } from "@/lib/realtime/presence";
import { useActivitySubscription } from "@/lib/realtime/useActivitySubscription";
import { usePresenceChannel } from "@/lib/realtime/usePresenceChannel";
import { createBrowserClient } from "@/lib/supabase/browser";
import {
  parseProviderFilters,
  providerFilterDefaults,
  serializeProviderFilters
} from "@/lib/ui/url-state";
import { proveedorInputSchema, type ProveedorInput } from "@/lib/validations/providers";
import type { Proveedor, Recurso } from "@/types/domain";

type WorkspaceState = {
  canMutate: boolean;
  scope: DataScope;
};

const emptyForm: ProviderFormState = {
  contacto: "",
  disponible_para_cliente: false,
  direccion: "",
  email: "",
  nombre: "",
  notas: "",
  ruc: "",
  telefono: ""
};

const initialFilters: ProviderFiltersValue = providerFilterDefaults;

export default function ProveedoresPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [providers, setProviders] = useState<Proveedor[]>([]);
  const [resources, setResources] = useState<Recurso[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [filters, setFilters] = useState<ProviderFiltersValue>(() => parseProviderFilters(searchParams));
  const [form, setForm] = useState<ProviderFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProviderFormState, string>>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Proveedor | undefined>();
  const [statusTarget, setStatusTarget] = useState<Proveedor | undefined>();
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

    const [providersResult, resourcesResult] = await Promise.all([
      listProviders(supabase, nextWorkspace.scope),
      supabase
        .from("recursos")
        .select("*")
        .eq("organizacion_id", nextWorkspace.scope.organizacionId)
    ]);

    if (!providersResult.ok) {
      setLoadError(errorMessage(providersResult.error));
      setIsLoading(false);
      return;
    }

    if (resourcesResult.error) {
      setLoadError(resourcesResult.error.message || "No se pudieron consultar los recursos vinculados.");
      setIsLoading(false);
      return;
    }

    setWorkspace(nextWorkspace);
    setProviders(providersResult.data);
    setResources(resourcesResult.data || []);
    setSelectedProviderId((current) => current || providersResult.data[0]?.id);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const nextFilters = parseProviderFilters(searchParams);
    setFilters((current) =>
      providerFiltersEqual(current, nextFilters) ? current : nextFilters
    );
  }, [searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = serializeProviderFilters(filters, searchParams).toString();
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
    (payload: ActivityRealtimePayload) => ["proveedor", "recurso", "recurso_proveedor_precio"].includes(payload.entityType),
    []
  );
  const activity = useActivitySubscription({
    currentActorId: workspace?.scope.actorId,
    enabled: Boolean(workspace),
    filter: activityFilter,
    onRefetch: loadData,
    topicScope: activityTopic
  });
  const editingProvider = editingId ? providers.find((provider) => provider.id === editingId) : undefined;
  const presenceTarget: PresenceTarget | null = editingProvider
    ? { id: editingProvider.id, label: editingProvider.nombre, type: "proveedor" }
    : selectedProviderId
      ? {
          id: selectedProviderId,
          label: providers.find((provider) => provider.id === selectedProviderId)?.nombre || "proveedor",
          type: "proveedor"
        }
      : null;
  const presence = usePresenceChannel({
    editing: editingProvider ? presenceTarget : null,
    enabled: Boolean(workspace),
    page: "/proveedores",
    topicScope: activityTopic,
    viewing: presenceTarget
  });

  const resourceCounts = useMemo(() => {
    const counts = new Map<string, number>();

    resources.forEach((resource) => {
      if (resource.proveedor_id) {
        counts.set(resource.proveedor_id, (counts.get(resource.proveedor_id) || 0) + 1);
      }
    });

    return counts;
  }, [resources]);

  const filteredProviders = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return providers.filter((provider) => {
      const searchable = `${provider.nombre} ${provider.ruc || ""}`.toLowerCase();
      const matchesQuery = query ? searchable.includes(query) : true;
      const matchesStatus = filters.status === "todos" ? true : provider.estado === filters.status;
      const matchesVisibility =
        filters.clientVisibility === "todos"
          ? true
          : filters.clientVisibility === "visible"
            ? provider.disponible_para_cliente
            : !provider.disponible_para_cliente;

      return matchesQuery && matchesStatus && matchesVisibility;
    });
  }, [filters, providers]);

  function openCreateForm() {
    if (!workspace?.canMutate) {
      setMutationError("Solo admins de proyecto u organización pueden crear proveedores.");
      return;
    }

    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setMutationError(null);
    setConflict(null);
    setShowForm(true);
  }

  function openEditForm(provider: Proveedor) {
    if (!workspace?.canMutate) {
      setMutationError("Solo admins de proyecto u organización pueden editar proveedores.");
      return;
    }

    setEditingId(provider.id);
    setSelectedProviderId(provider.id);
    setForm(formFromProvider(provider));
    setFormErrors({});
    setMutationError(null);
    setConflict(null);
    setShowForm(true);
  }

  function handleFormChange<Field extends keyof ProviderFormState>(
    field: Field,
    value: ProviderFormState[Field]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
    setMutationError(null);
  }

  async function handleSubmit() {
    if (!workspace) {
      setMutationError("No se encontró una organización activa para guardar el proveedor.");
      return;
    }

    if (!workspace.canMutate) {
      setMutationError("Solo admins de proyecto u organización pueden guardar proveedores.");
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

    const baseProvider = editingId ? providers.find((provider) => provider.id === editingId) : undefined;
    const result = editingId
      ? await updateProvider(createBrowserClient(), workspace.scope, editingId, formData, {
          attempted: formData,
          base: baseProvider,
          expectedUpdatedAt: baseProvider?.updated_at
        })
      : await createProvider(createBrowserClient(), workspace.scope, formData);

    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error) && editingId) {
        setConflict({
          error: result.error,
          retry: () => retryProviderUpdate(editingId, formData, result.error)
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setProviders((current) =>
      editingId
        ? current.map((provider) => (provider.id === result.data.id ? result.data : provider))
        : [result.data, ...current]
    );
    setSelectedProviderId(result.data.id);
    setShowForm(false);
    setEditingId(null);
    setFormErrors({});
  }

  async function confirmToggleStatus() {
    if (!statusTarget || !workspace) {
      return;
    }

    setIsSaving(true);
    setMutationError(null);

    const nextStatus = statusTarget.estado === "activo" ? "inactivo" : "activo";
    const result =
      nextStatus === "activo"
        ? await activateProvider(createBrowserClient(), workspace.scope, statusTarget.id, {
            attempted: { estado: nextStatus },
            base: statusTarget,
            expectedUpdatedAt: statusTarget.updated_at
          })
        : await deactivateProvider(createBrowserClient(), workspace.scope, statusTarget.id, {
            attempted: { estado: nextStatus },
            base: statusTarget,
            expectedUpdatedAt: statusTarget.updated_at
          });

    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error)) {
        setConflict({
          error: result.error,
          retry: () => retryProviderStatus(statusTarget, result.error)
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setProviders((current) =>
      current.map((provider) => (provider.id === result.data.id ? result.data : provider))
    );
    setSelectedProviderId(result.data.id);
    setStatusTarget(undefined);
  }

  async function confirmDelete() {
    if (!deleteTarget || !workspace) {
      return;
    }

    setIsSaving(true);
    setMutationError(null);

    const result = await deleteProvider(createBrowserClient(), workspace.scope, deleteTarget.id);
    setIsSaving(false);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    setProviders((current) => current.filter((provider) => provider.id !== result.data.id));
    setSelectedProviderId((current) =>
      current === result.data.id ? providers.find((provider) => provider.id !== result.data.id)?.id : current
    );
    setDeleteTarget(undefined);
  }

  async function retryProviderUpdate(providerId: string, input: ProveedorInput, error: DataError) {
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
    const result = await updateProvider(createBrowserClient(), workspace.scope, providerId, input, {
      attempted: input,
      expectedUpdatedAt
    });
    setIsSaving(false);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    setProviders((current) => current.map((provider) => (provider.id === result.data.id ? result.data : provider)));
    setSelectedProviderId(result.data.id);
    setShowForm(false);
    setEditingId(null);
    setFormErrors({});
  }

  async function retryProviderStatus(provider: Proveedor, error: DataError) {
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
    const nextStatus = provider.estado === "activo" ? "inactivo" : "activo";
    const result =
      nextStatus === "activo"
        ? await activateProvider(createBrowserClient(), workspace.scope, provider.id, {
            attempted: { estado: nextStatus },
            base: provider,
            expectedUpdatedAt
          })
        : await deactivateProvider(createBrowserClient(), workspace.scope, provider.id, {
            attempted: { estado: nextStatus },
            base: provider,
            expectedUpdatedAt
          });
    setIsSaving(false);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    setProviders((current) => current.map((item) => (item.id === result.data.id ? result.data : item)));
    setSelectedProviderId(result.data.id);
    setStatusTarget(undefined);
  }

  const emptyMessage =
    providers.length === 0
      ? "No hay proveedores registrados"
      : "No se encontraron proveedores";

  return (
    <AppLayout>
      <ConflictResolutionDialog
        error={conflict?.error || null}
        onDiscard={() => {
          setConflict(null);
          setShowForm(false);
          setEditingId(null);
          setDeleteTarget(undefined);
          setStatusTarget(undefined);
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
                    ? "Crear proveedor"
                    : "Solo admins de proyecto u organización pueden crear proveedores"
                }
              >
                Nuevo proveedor
              </Button>
            </>
          }
          breadcrumbs={[{ label: "Base de datos" }, { label: "Proveedores" }]}
          title="Proveedores"
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
          <LoadingState label="Cargando proveedores" rows={5} />
        ) : loadError ? (
          <EmptyState
            action={
                <Button icon={RefreshCcw} onClick={() => void loadData()} variant="secondary">
                Reintentar
              </Button>
            }
            description="Verifica la sesión y la organización activa antes de volver a intentar."
            icon={WalletCards}
            title="No se pudo cargar proveedores"
          />
        ) : (
          <>
            <ProviderMetrics providers={providers} resources={resources} />

            <ProviderFilters
              filters={filters}
              onChange={setFilters}
              resultCount={filteredProviders.length}
            />

            <div className="flex min-w-0 flex-col gap-5">
              <ProviderTable
                canMutate={Boolean(workspace?.canMutate)}
                emptyMessage={emptyMessage}
                onDelete={setDeleteTarget}
                onEdit={openEditForm}
                onSelect={(provider) => setSelectedProviderId(provider.id)}
                onToggleStatus={setStatusTarget}
                providers={filteredProviders}
                resourceCounts={resourceCounts}
                selectedProviderId={selectedProviderId}
              />

              {showForm ? (
                <ProviderFormPanel
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
            </div>
          </>
        )}
      </div>

      <ConfirmDeleteProviderDialog
        onCancel={() => setDeleteTarget(undefined)}
        onConfirm={confirmDelete}
        provider={deleteTarget}
        resourceCount={deleteTarget ? resourceCounts.get(deleteTarget.id) || 0 : 0}
      />
      <ConfirmProviderStatusDialog
        onCancel={() => setStatusTarget(undefined)}
        onConfirm={confirmToggleStatus}
        provider={statusTarget}
      />
    </AppLayout>
  );
}

function getPersistedUpdatedAt(error: DataError) {
  return isOptimisticConflict(error) && "updated_at" in (error.details.persisted as Record<string, unknown>)
    ? String((error.details.persisted as { updated_at: string }).updated_at)
    : undefined;
}

function formFromProvider(provider: Proveedor): ProviderFormState {
  return {
    contacto: provider.contacto || "",
    disponible_para_cliente: provider.disponible_para_cliente ?? false,
    direccion: provider.direccion || "",
    email: provider.email || "",
    nombre: provider.nombre,
    notas: provider.notas || "",
    ruc: provider.ruc || "",
    telefono: provider.telefono || ""
  };
}

function providerFiltersEqual(first: ProviderFiltersValue, second: ProviderFiltersValue) {
  return (
    first.clientVisibility === second.clientVisibility &&
    first.query === second.query &&
    first.status === second.status
  );
}

function validateForm(form: ProviderFormState): {
  data?: ProveedorInput;
  errors: Partial<Record<keyof ProviderFormState, string>>;
} {
  const parsed = proveedorInputSchema.safeParse(form);

  if (parsed.success) {
    return { data: parsed.data, errors: {} };
  }

  const flattened = parsed.error.flatten().fieldErrors;
  const errors: Partial<Record<keyof ProviderFormState, string>> = {};

  Object.entries(flattened).forEach(([field, messages]) => {
    if (messages?.[0]) {
      errors[field as keyof ProviderFormState] = messages[0];
    }
  });

  return { errors };
}

function errorMessage(error: DataError) {
  if (error.code === "permission") {
    return "No tienes permisos para realizar esta acción.";
  }

  if (error.code === "conflict") {
    return "Ya existe un proveedor con esos datos. Revisa el RUC antes de guardar.";
  }

  return error.message;
}
