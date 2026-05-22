"use client";

import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  RefreshCcw,
  ShieldCheck
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { ApuTabs } from "@/components/presupuestos/ApuTabs";
import { BudgetSummaryCard } from "@/components/presupuestos/BudgetSummaryCard";
import { BudgetTable } from "@/components/presupuestos/BudgetTable";
import { formatCurrency } from "@/components/presupuestos/budget-ui";
import { ActivityToasts } from "@/components/shared/ActivityToasts";
import { Button } from "@/components/shared/Button";
import { ConflictResolutionDialog } from "@/components/shared/ConflictResolutionDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PresenceBar } from "@/components/shared/PresenceBar";
import { StatCard } from "@/components/shared/StatCard";
import {
  addDraftPartida,
  emitOfficialBudgetVersion,
  ensureActiveBudgetDraft,
  getActiveBudgetDraft,
  getOfficialBudgetVersion,
  overrideDraftClientPrice,
  refreshDraftCurrentPrices,
  removeDraftLine,
  selectDraftResourceClientQuote,
  setDraftLinePriceLock,
  setDraftResourcePriceLock,
  updateBudgetDraft,
  updateDraftLineMetrado,
  type BudgetDraftBundle,
  type OfficialBudgetVersionBundle,
} from "@/lib/data/budgets";
import { isOptimisticConflict } from "@/lib/data/conflicts";
import { listQuotesForResources } from "@/lib/data/quotes";
import type { DataError, DataScope } from "@/lib/data/types";
import { resolveProjectWorkspace } from "@/lib/data/workspace";
import { budgetDraftMetradoUpdateSchema, budgetDraftUpdateSchema } from "@/lib/validations/budgets";
import { validateFormData } from "@/lib/validations/form";
import { precioClienteOverrideSchema, type PrecioClienteOverrideInput } from "@/lib/validations/quotes";
import {
  exportBudgetToExcel,
  exportClientBudgetToExcel,
  openBudgetPrintView,
  openClientBudgetPrintView
} from "@/lib/exports/budget";
import { useActivitySubscription } from "@/lib/realtime/useActivitySubscription";
import type { PresenceTarget } from "@/lib/realtime/presence";
import { usePresenceChannel } from "@/lib/realtime/usePresenceChannel";
import { createBrowserClient } from "@/lib/supabase/browser";
import { setOptionalParam } from "@/lib/ui/url-state";
import type {
  Partida,
  Presupuesto,
  PresupuestoBorrador,
  PresupuestoBorradorPartida,
  PresupuestoBorradorPartidaRecurso,
  PresupuestoPartida,
  PresupuestoPartidaRecursoSnapshot,
  Proyecto,
  RecursoProveedorPrecio
} from "@/types/domain";

type WorkspaceState = {
  canEmit: boolean;
  canMutate: boolean;
  projects: Proyecto[];
  scope: DataScope;
};

type BudgetConflictState = { error: DataError; retry: () => Promise<void> } | null;
type ActivityToastsProps = ComponentProps<typeof ActivityToasts>;

export function PresupuestosLoading() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1680px] px-5 py-6 lg:px-8">
        <LoadingState label="Cargando presupuesto" rows={6} />
      </div>
    </AppLayout>
  );
}

export function PresupuestosWorkspace({ requestedProjectId }: { requestedProjectId?: string } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [bundle, setBundle] = useState<BudgetDraftBundle | null>(null);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [quotesByResourceId, setQuotesByResourceId] = useState<Record<string, RecursoProveedorPrecio[]>>({});
  const [selectedLineId, setSelectedLineId] = useState<string | undefined>(
    () => searchParams.get("linea") || undefined
  );
  const lastSearchLineIdRef = useRef<string | undefined>(searchParams.get("linea") || undefined);
  const [selectedPartidaId, setSelectedPartidaId] = useState("");
  const [draftForm, setDraftForm] = useState({
    cliente: "",
    gastos_generales_porcentaje: "10",
    igv_porcentaje: "18",
    nombre: "",
    ubicacion: "",
    utilidad_porcentaje: "10"
  });
  const [overrideResourceId, setOverrideResourceId] = useState<string | null>(null);
  const [overrideValue, setOverrideValue] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [officialVersion, setOfficialVersion] = useState<OfficialBudgetVersionBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [conflict, setConflict] = useState<BudgetConflictState>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setMutationError(null);

    const supabase = createBrowserClient();
    const workspaceResult = await resolveProjectWorkspace(supabase, requestedProjectId);

    if (!workspaceResult.ok) {
      setLoadError(workspaceResult.error.message);
      setIsLoading(false);
      return;
    }

    const nextWorkspace: WorkspaceState = workspaceResult.data;

    const draftRequest = nextWorkspace.canMutate
      ? ensureActiveBudgetDraft(supabase, nextWorkspace.scope)
      : getActiveBudgetDraft(supabase, nextWorkspace.scope);
    const [bundleResult, partidasResult] = await Promise.all([
      draftRequest,
      supabase
        .from("partidas")
        .select("*")
        .eq("organizacion_id", nextWorkspace.scope.organizacionId)
        .eq("estado", "activo")
        .order("codigo", { ascending: true })
    ]);

    if (!bundleResult.ok) {
      setLoadError(errorMessage(bundleResult.error));
      setIsLoading(false);
      return;
    }

    if (partidasResult.error) {
      setLoadError(partidasResult.error.message || "No se pudieron consultar las partidas.");
      setIsLoading(false);
      return;
    }

    setWorkspace(nextWorkspace);
    setBundle(bundleResult.data);
    setDraftForm({
      cliente: bundleResult.data.draft.cliente || "",
      gastos_generales_porcentaje: String(bundleResult.data.draft.gastos_generales_porcentaje),
      igv_porcentaje: String(bundleResult.data.draft.igv_porcentaje),
      nombre: bundleResult.data.draft.nombre,
      ubicacion: bundleResult.data.draft.ubicacion || "",
      utilidad_porcentaje: String(bundleResult.data.draft.utilidad_porcentaje)
    });
    setPartidas((partidasResult.data || []) as Partida[]);
    setSelectedLineId((current) =>
      current && bundleResult.data.lines.some((line) => line.id === current)
        ? current
        : bundleResult.data.lines[0]?.id
    );
    const resourceIds = bundleResult.data.resources
      .map((resource) => resource.recurso_id)
      .filter((resourceId): resourceId is string => Boolean(resourceId));
    const quotesResult = await listQuotesForResources(supabase, nextWorkspace.scope, resourceIds);

    if (quotesResult.ok) {
      setQuotesByResourceId(groupQuotesForUi(quotesResult.data));
    }

    setIsLoading(false);
  }, [requestedProjectId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!bundle) {
      return;
    }

    const queryLineId = searchParams.get("linea") || undefined;
    const queryChanged = queryLineId !== lastSearchLineIdRef.current;
    const selectedLineExists = selectedLineId
      ? bundle.lines.some((line) => line.id === selectedLineId)
      : false;

    lastSearchLineIdRef.current = queryLineId;

    if (queryChanged) {
      if (queryLineId && bundle.lines.some((line) => line.id === queryLineId)) {
        setSelectedLineId(queryLineId);
        return;
      }

      if (!selectedLineExists) {
        setSelectedLineId(bundle.lines[0]?.id);
      }
      return;
    }

    if (selectedLineId && !selectedLineExists) {
      setSelectedLineId(bundle.lines[0]?.id);
    } else if (!selectedLineId && bundle.lines[0]) {
      setSelectedLineId(bundle.lines[0]?.id);
    }
  }, [bundle, searchParams, selectedLineId]);

  useEffect(() => {
    const nextSearch = setOptionalParam(searchParams, "linea", selectedLineId).toString();
    const currentSearch = searchParams.toString();

    if (nextSearch !== currentSearch) {
      lastSearchLineIdRef.current = selectedLineId;
      router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchParams, selectedLineId]);

  const activityTopic = useMemo(
    () => (workspace?.scope.proyectoId ? { proyectoId: workspace.scope.proyectoId, type: "project" as const } : undefined),
    [workspace?.scope.proyectoId]
  );
  const activity = useActivitySubscription({
    currentActorId: workspace?.scope.actorId,
    enabled: Boolean(workspace?.scope.proyectoId),
    onRefetch: loadData,
    topicScope: activityTopic
  });
  const draftLineById = useMemo(
    () => new Map(bundle?.lines.map((line) => [line.id, line]) || []),
    [bundle?.lines]
  );
  const selectedDraftLine = useMemo(
    () => (selectedLineId ? draftLineById.get(selectedLineId) : undefined),
    [draftLineById, selectedLineId]
  );
  const presenceTarget: PresenceTarget | null = useMemo(() => {
    if (selectedDraftLine) {
      return {
        id: selectedDraftLine.id,
        label: selectedDraftLine.nombre_snapshot,
        type: "presupuesto_borrador_partida"
      };
    }

    if (!bundle) {
      return null;
    }

    return { id: bundle.draft.id, label: bundle.draft.nombre, type: "presupuesto_borrador" };
  }, [bundle, selectedDraftLine]);
  const presence = usePresenceChannel({
    editing: presenceTarget,
    enabled: Boolean(workspace?.scope.proyectoId),
    page: "/presupuestos",
    topicScope: activityTopic,
    viewing: presenceTarget
  });
  const handleConflictDiscard = useCallback(() => {
    setConflict(null);
    void loadData();
  }, [loadData]);
  const handleConflictOverwrite = useCallback(() => {
    const retry = conflict?.retry;
    setConflict(null);
    if (retry) {
      void retry();
    }
  }, [conflict]);

  const activeBudget = useMemo(
    () => (bundle ? draftToBudget(bundle.draft) : null),
    [bundle]
  );
  const activeLines = useMemo(
    () => (bundle ? bundle.lines.map(draftLineToBudgetLine) : []),
    [bundle]
  );
  const activeResources = useMemo(
    () => (bundle ? bundle.resources.map(draftResourceToSnapshot) : []),
    [bundle]
  );
  const selectedLine = useMemo(
    () => activeLines.find((line) => line.id === selectedLineId) || activeLines[0],
    [activeLines, selectedLineId]
  );
  const selectedLineResources = useMemo(
    () => (
      selectedLine
        ? activeResources.filter((resource) => resource.presupuesto_partida_id === selectedLine.id)
        : []
    ),
    [activeResources, selectedLine]
  );
  const availablePartidas = useMemo(() => {
    const used = new Set(bundle?.lines.map((line) => line.partida_id).filter(Boolean));
    return partidas.filter((partida) => !used.has(partida.id));
  }, [bundle, partidas]);
  const warningResources = useMemo(
    () => bundle?.resources.filter((resource) => resource.precio_cliente_advertencia) || [],
    [bundle?.resources]
  );

  const kpis = useMemo(
    () => [
      {
        icon: ClipboardList,
        label: "Partidas",
        link: "Borrador activo",
        tone: "violet" as const,
        value: String(activeLines.length)
      },
      {
        icon: FileSpreadsheet,
        label: "Versiones oficiales",
        link: "Snapshots",
        tone: "sky" as const,
        value: String(bundle?.versions.length || 0)
      },
      {
        icon: AlertTriangle,
        label: "Alertas cliente",
        link: "Fallbacks",
        tone: "amber" as const,
        value: String(warningResources.length)
      },
      {
        icon: ShieldCheck,
        label: "Total interno",
        link: "Con IGV",
        tone: "green" as const,
        value: activeBudget ? formatCurrency(activeBudget.total) : "S/ 0.00"
      }
    ],
    [activeBudget, activeLines.length, bundle?.versions.length, warningResources.length]
  );

  async function refreshClientPrices() {
    if (!workspace || !bundle) {
      return;
    }

    setIsSaving(true);
    setMutationError(null);
    const result = await refreshDraftCurrentPrices(createBrowserClient(), workspace.scope, bundle.draft.id);
    setIsSaving(false);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    setBundle(result.data);
    await reloadQuotes(result.data);
  }

  async function saveDraftSettings() {
    if (!workspace || !bundle) {
      return;
    }

    const validation = validateFormData(budgetDraftUpdateSchema, {
      cliente: draftForm.cliente || null,
      gastos_generales_porcentaje: draftForm.gastos_generales_porcentaje,
      igv_porcentaje: draftForm.igv_porcentaje,
      nombre: draftForm.nombre,
      ubicacion: draftForm.ubicacion || null,
      utilidad_porcentaje: draftForm.utilidad_porcentaje
    });

    if (!validation.data) {
      setMutationError(firstFormError(validation.errors) || "Revisa los datos del borrador.");
      return;
    }

    const input = validation.data;
    setIsSaving(true);
    setMutationError(null);
    const result = await updateBudgetDraft(createBrowserClient(), workspace.scope, bundle.draft.id, input, {
      attempted: input,
      base: bundle.draft,
      expectedUpdatedAt: bundle.draft.updated_at
    });
    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error)) {
        setConflict({
          error: result.error,
          retry: () => retryBundleConflict(result.error, (expectedUpdatedAt) =>
            updateBudgetDraft(createBrowserClient(), workspace.scope, bundle.draft.id, input, {
              attempted: input,
              expectedUpdatedAt
            })
          )
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setBundle(result.data);
  }

  async function addPartida() {
    if (!workspace || !bundle || !selectedPartidaId) {
      return;
    }

    setIsSaving(true);
    setMutationError(null);
    const result = await addDraftPartida(
      createBrowserClient(),
      workspace.scope,
      bundle.draft.id,
      selectedPartidaId
    );
    setIsSaving(false);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    setBundle(result.data);
    setSelectedPartidaId("");
    setSelectedLineId(result.data.lines.at(-1)?.id);
    await reloadQuotes(result.data);
  }

  async function updateMetrado(lineId: string, value: string) {
    if (!workspace || !bundle) {
      return;
    }

    const line = bundle.lines.find((item) => item.id === lineId);
    const validation = validateFormData(budgetDraftMetradoUpdateSchema, { metrado: value });

    if (!line || !validation.data) {
      return;
    }

    const parsed = validation.data.metrado;
    const result = await updateDraftLineMetrado(createBrowserClient(), workspace.scope, line, parsed, {
      attempted: { metrado: parsed },
      base: line,
      expectedUpdatedAt: line.updated_at
    });

    if (result.ok) {
      setBundle(result.data);
    } else {
      if (isOptimisticConflict(result.error)) {
        setConflict({
          error: result.error,
          retry: () => retryBundleConflict(result.error, (expectedUpdatedAt) =>
            updateDraftLineMetrado(createBrowserClient(), workspace.scope, line, parsed, {
              attempted: { metrado: parsed },
              expectedUpdatedAt
            })
          )
        });
      }
      setMutationError(errorMessage(result.error));
    }
  }

  async function deleteLine(lineId: string) {
    if (!workspace || !bundle) {
      return;
    }

    const line = bundle.lines.find((item) => item.id === lineId);

    if (!line) {
      return;
    }

    setIsSaving(true);
    const result = await removeDraftLine(createBrowserClient(), workspace.scope, line, {
      attempted: null,
      base: line,
      expectedUpdatedAt: line.updated_at
    });
    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error)) {
        setConflict({
          error: result.error,
          retry: () => retryBundleConflict(result.error, (expectedUpdatedAt) =>
            removeDraftLine(createBrowserClient(), workspace.scope, line, {
              attempted: null,
              expectedUpdatedAt
            })
          )
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setBundle(result.data);
    setSelectedLineId(result.data.lines[0]?.id);
  }

  async function saveOverride() {
    if (!workspace || !overrideResourceId) {
      return;
    }

    const validation = validateFormData(precioClienteOverrideSchema, {
      motivo_precio_cliente_override: overrideReason,
      precio_cliente_actual: overrideValue
    });

    if (!validation.data) {
      setMutationError(firstFormError(validation.errors) || "Revisa el precio cliente manual.");
      return;
    }

    setIsSaving(true);
    const baseResource = bundle?.resources.find((resource) => resource.id === overrideResourceId);
    const input = validation.data;
    const result = await overrideDraftClientPrice(createBrowserClient(), workspace.scope, overrideResourceId, input, {
      attempted: input,
      base: baseResource,
      expectedUpdatedAt: baseResource?.updated_at
    });
    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error)) {
        setConflict({
          error: result.error,
          retry: () =>
            retryBundleConflict(
              result.error,
              (expectedUpdatedAt) =>
                overrideDraftClientPrice(createBrowserClient(), workspace.scope, overrideResourceId, input, {
                  attempted: input,
                  expectedUpdatedAt
                }),
              { reloadQuotes: true }
            )
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setBundle(result.data);
    setOverrideResourceId(null);
    setOverrideValue("");
    setOverrideReason("");
  }

  async function selectClientQuote(resourceId: string, quoteId: string) {
    if (!workspace) {
      return;
    }

    setIsSaving(true);
    setMutationError(null);
    const baseResource = bundle?.resources.find((resource) => resource.id === resourceId);
    const input = {
      quoteId: quoteId || null
    };
    const result = await selectDraftResourceClientQuote(createBrowserClient(), workspace.scope, resourceId, input, {
      attempted: input,
      base: baseResource,
      expectedUpdatedAt: baseResource?.updated_at
    });
    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error)) {
        setConflict({
          error: result.error,
          retry: () =>
            retryBundleConflict(
              result.error,
              (expectedUpdatedAt) =>
                selectDraftResourceClientQuote(createBrowserClient(), workspace.scope, resourceId, input, {
                  attempted: input,
                  expectedUpdatedAt
                }),
              { reloadQuotes: true }
            )
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setBundle(result.data);
  }

  async function toggleLineLock(lineId: string, precioFijado: boolean) {
    if (!workspace) {
      return;
    }

    setIsSaving(true);
    setMutationError(null);
    const line = bundle?.lines.find((item) => item.id === lineId);
    const input = {
      motivo_precio_fijado: precioFijado ? "Precio fijado desde presupuesto." : null,
      precio_fijado: precioFijado
    };
    const result = await setDraftLinePriceLock(createBrowserClient(), workspace.scope, lineId, input, {
      attempted: input,
      base: line,
      expectedUpdatedAt: line?.updated_at
    });
    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error)) {
        setConflict({
          error: result.error,
          retry: () => retryBundleConflict(result.error, (expectedUpdatedAt) =>
            setDraftLinePriceLock(createBrowserClient(), workspace.scope, lineId, input, {
              attempted: input,
              expectedUpdatedAt
            })
          )
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setBundle(result.data);
  }

  async function toggleResourceLock(resourceId: string, precioFijado: boolean) {
    if (!workspace) {
      return;
    }

    setIsSaving(true);
    setMutationError(null);
    const resource = bundle?.resources.find((item) => item.id === resourceId);
    const input = {
      motivo_precio_fijado: precioFijado ? "Precio de recurso fijado desde presupuesto." : null,
      precio_fijado: precioFijado
    };
    const result = await setDraftResourcePriceLock(createBrowserClient(), workspace.scope, resourceId, input, {
      attempted: input,
      base: resource,
      expectedUpdatedAt: resource?.updated_at
    });
    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error)) {
        setConflict({
          error: result.error,
          retry: () => retryBundleConflict(result.error, (expectedUpdatedAt) =>
            setDraftResourcePriceLock(createBrowserClient(), workspace.scope, resourceId, input, {
              attempted: input,
              expectedUpdatedAt
            })
          )
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setBundle(result.data);
  }

  async function emitVersion() {
    if (!workspace || !bundle) {
      return;
    }

    setIsSaving(true);
    setMutationError(null);
    const result = await emitOfficialBudgetVersion(createBrowserClient(), workspace.scope, bundle.draft.id, {
      attempted: null,
      base: bundle.draft,
      expectedUpdatedAt: bundle.draft.updated_at
    });
    setIsSaving(false);

    if (!result.ok) {
      if (isOptimisticConflict(result.error)) {
        setConflict({
          error: result.error,
          retry: () => retryOfficialVersionConflict(result.error)
        });
      }
      setMutationError(errorMessage(result.error));
      return;
    }

    setOfficialVersion(result.data);
    await loadData();
  }

  async function retryOfficialVersionConflict(error: DataError) {
    if (!workspace || !bundle) {
      return;
    }

    const expectedUpdatedAt = getPersistedUpdatedAt(error);

    if (!expectedUpdatedAt) {
      void loadData();
      return;
    }

    setIsSaving(true);
    const result = await emitOfficialBudgetVersion(createBrowserClient(), workspace.scope, bundle.draft.id, {
      attempted: null,
      expectedUpdatedAt
    });
    setIsSaving(false);

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    setOfficialVersion(result.data);
    await loadData();
  }

  async function handleBundleRetryResult(
    result: Awaited<ReturnType<typeof updateBudgetDraft>>,
    options: { reloadQuotes?: boolean } = {}
  ) {
    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return;
    }

    setBundle(result.data);
    if (options.reloadQuotes) {
      await reloadQuotes(result.data);
    }
  }

  async function retryBundleConflict(
    error: DataError,
    mutation: (expectedUpdatedAt: string) => Promise<Awaited<ReturnType<typeof updateBudgetDraft>>>,
    options: { reloadQuotes?: boolean } = {}
  ) {
    const expectedUpdatedAt = getPersistedUpdatedAt(error);

    if (!expectedUpdatedAt) {
      void loadData();
      return;
    }

    setIsSaving(true);
    const result = await mutation(expectedUpdatedAt);
    setIsSaving(false);
    void handleBundleRetryResult(result, options);
  }

  async function reloadQuotes(nextBundle: BudgetDraftBundle) {
    if (!workspace) {
      return;
    }

    const resourceIds = nextBundle.resources
      .map((resource) => resource.recurso_id)
      .filter((resourceId): resourceId is string => Boolean(resourceId));
    const result = await listQuotesForResources(createBrowserClient(), workspace.scope, resourceIds);

    if (result.ok) {
      setQuotesByResourceId(groupQuotesForUi(result.data));
    }
  }

  async function loadLatestOfficialVersion() {
    if (!workspace || !bundle?.versions[0]) {
      setMutationError("Todavía no hay versiones oficiales para exportar al cliente.");
      return null;
    }

    if (officialVersion?.version.id === bundle.versions[0].id) {
      return officialVersion;
    }

    const result = await getOfficialBudgetVersion(
      createBrowserClient(),
      workspace.scope,
      bundle.versions[0].id
    );

    if (!result.ok) {
      setMutationError(errorMessage(result.error));
      return null;
    }

    setOfficialVersion(result.data);
    return result.data;
  }

  async function exportOfficialExcel() {
    const version = await loadLatestOfficialVersion();
    if (version) {
      exportBudgetToExcel({
        lines: version.lines,
        resources: version.resources,
        source: "official",
        version: version.version
      });
    }
  }

  async function exportOfficialPdf() {
    const version = await loadLatestOfficialVersion();
    if (version) {
      openBudgetPrintView({
        lines: version.lines,
        resources: version.resources,
        source: "official",
        version: version.version
      });
    }
  }

  async function exportClientExcel() {
    const version = await loadLatestOfficialVersion();
    if (version) {
      exportClientBudgetToExcel(version);
    }
  }

  async function exportClientPdf() {
    const version = await loadLatestOfficialVersion();
    if (version) {
      openClientBudgetPrintView(version);
    }
  }

  if (isLoading) {
    return (
      <BudgetWorkspaceFrame
        activity={{ dismissToast: activity.dismissToast, status: activity.status, toasts: activity.toasts }}
        conflict={conflict}
        onConflictDiscard={handleConflictDiscard}
        onConflictOverwrite={handleConflictOverwrite}
      >
        <LoadingState label="Cargando presupuesto" rows={6} />
      </BudgetWorkspaceFrame>
    );
  }

  if (loadError || !bundle || !activeBudget) {
    return (
      <BudgetWorkspaceFrame
        activity={{ dismissToast: activity.dismissToast, status: activity.status, toasts: activity.toasts }}
        conflict={conflict}
        onConflictDiscard={handleConflictDiscard}
        onConflictOverwrite={handleConflictOverwrite}
      >
        <EmptyState
          action={<Button icon={RefreshCcw} onClick={() => void loadData()} variant="secondary">Reintentar</Button>}
          description={loadError || "No se encontró un presupuesto activo."}
          icon={FileText}
          title="No se pudo cargar presupuestos"
        />
      </BudgetWorkspaceFrame>
    );
  }

  return (
    <BudgetWorkspaceFrame
      activity={{ dismissToast: activity.dismissToast, status: activity.status, toasts: activity.toasts }}
      conflict={conflict}
      contentClassName="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-5 py-6 lg:px-8"
      onConflictDiscard={handleConflictDiscard}
      onConflictOverwrite={handleConflictOverwrite}
    >
        <PresenceBar target={presenceTarget} users={presence.users} />
        <PageHeader
          actions={
            <>
              <select
                aria-label="Seleccionar proyecto"
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                onChange={(event) => {
                  window.location.href = `/presupuestos/${event.target.value}`;
                }}
                value={workspace?.scope.proyectoId}
              >
                {workspace?.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.nombre}
                  </option>
                ))}
              </select>
              <Button disabled={isSaving} icon={RefreshCcw} onClick={() => void loadData()} variant="secondary">
                Recargar
              </Button>
              <Button disabled={isSaving || !workspace?.canMutate} icon={BarChart3} onClick={() => void refreshClientPrices()} variant="secondary">
                Actualizar precios cliente
              </Button>
              <Button disabled={isSaving || !workspace?.canEmit} icon={CheckCircle2} onClick={() => void emitVersion()}>
                Emitir versión oficial
              </Button>
            </>
          }
          backLink={{ href: "/", label: "Volver al dashboard" }}
          breadcrumbs={[
            { label: "Proyectos" },
            { label: activeBudget.proyecto_nombre },
            { label: activeBudget.version }
          ]}
          description="Borrador persistente con precios internos, precios cliente y snapshots oficiales congelados."
          title="Presupuesto de obra"
        />

        {mutationError ? (
          <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            {mutationError}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </section>

        <section className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex min-w-0 flex-col gap-5">
            <BudgetTable
              availablePartidas={availablePartidas}
              budget={activeBudget}
              draftLines={bundle.lines}
              lines={activeLines}
              onAddPartida={() => void addPartida()}
              onMetradoChange={(lineId, value) => void updateMetrado(lineId, value)}
              onPartidaSelect={setSelectedPartidaId}
              onRemoveLine={(lineId) => void deleteLine(lineId)}
              onSelectLine={setSelectedLineId}
              onToggleLinePriceLock={(lineId, checked) => void toggleLineLock(lineId, checked)}
              selectedLineId={selectedLine?.id}
              selectedPartidaId={selectedPartidaId}
            />
            <ApuTabs line={selectedLine} resources={selectedLineResources} />
          </div>

          <aside className="grid min-w-0 gap-5">
            <DraftSettingsPanel
              draftForm={draftForm}
              isSaving={isSaving}
              onChange={(field, value) => setDraftForm((current) => ({ ...current, [field]: value }))}
              onSave={() => void saveDraftSettings()}
            />
            <BudgetSummaryCard
              budget={activeBudget}
              hasOfficialVersion={Boolean(bundle.versions[0])}
              onExportExcel={() =>
                exportBudgetToExcel({
                  budget: activeBudget,
                  lines: activeLines,
                  resources: activeResources,
                  source: "draft"
                })
              }
              onExportOfficialExcel={() => void exportOfficialExcel()}
              onExportOfficialPdf={() => void exportOfficialPdf()}
              onExportPdf={() =>
                openBudgetPrintView({
                  budget: activeBudget,
                  lines: activeLines,
                  resources: activeResources,
                  source: "draft"
                })
              }
            />
            <ClientPricePanel
              draftResources={bundle.resources}
              isSaving={isSaving}
              onClientQuoteSelect={(resourceId, quoteId) => void selectClientQuote(resourceId, quoteId)}
              onCancelOverride={() => {
                setOverrideResourceId(null);
                setOverrideValue("");
                setOverrideReason("");
              }}
              onClientExcel={() => void exportClientExcel()}
              onClientPdf={() => void exportClientPdf()}
              onEditOverride={(resource) => {
                setOverrideResourceId(resource.id);
                setOverrideValue(String(resource.precio_cliente_actual ?? ""));
                setOverrideReason(resource.motivo_precio_cliente_override || "");
              }}
              onOverrideReasonChange={setOverrideReason}
              onOverrideValueChange={setOverrideValue}
              onSaveOverride={() => void saveOverride()}
              onToggleResourcePriceLock={(resourceId, checked) => void toggleResourceLock(resourceId, checked)}
              overrideReason={overrideReason}
              overrideResourceId={overrideResourceId}
              overrideValue={overrideValue}
              quotesByResourceId={quotesByResourceId}
            />
          </aside>
        </section>
    </BudgetWorkspaceFrame>
  );
}

function BudgetWorkspaceFrame({
  activity,
  children,
  conflict,
  contentClassName = "mx-auto w-full max-w-[1680px] px-5 py-6 lg:px-8",
  onConflictDiscard,
  onConflictOverwrite
}: {
  activity: {
    dismissToast: ActivityToastsProps["onDismiss"];
    status: ActivityToastsProps["status"];
    toasts: ActivityToastsProps["toasts"];
  };
  children: ReactNode;
  conflict: BudgetConflictState;
  contentClassName?: string;
  onConflictDiscard: () => void;
  onConflictOverwrite: () => void;
}) {
  return (
    <AppLayout>
      <ConflictResolutionDialog
        error={conflict?.error || null}
        onDiscard={onConflictDiscard}
        onOverwrite={onConflictOverwrite}
        open={Boolean(conflict)}
      />
      <ActivityToasts
        onDismiss={activity.dismissToast}
        status={activity.status}
        toasts={activity.toasts}
      />
      <div className={contentClassName}>{children}</div>
    </AppLayout>
  );
}

function ClientPricePanel({
  draftResources,
  isSaving,
  onClientQuoteSelect,
  onCancelOverride,
  onClientExcel,
  onClientPdf,
  onEditOverride,
  onOverrideReasonChange,
  onOverrideValueChange,
  onSaveOverride,
  onToggleResourcePriceLock,
  overrideReason,
  overrideResourceId,
  overrideValue,
  quotesByResourceId
}: {
  draftResources: PresupuestoBorradorPartidaRecurso[];
  isSaving: boolean;
  onClientQuoteSelect: (resourceId: string, quoteId: string) => void;
  onCancelOverride: () => void;
  onClientExcel: () => void;
  onClientPdf: () => void;
  onEditOverride: (resource: PresupuestoBorradorPartidaRecurso) => void;
  onOverrideReasonChange: (value: string) => void;
  onOverrideValueChange: (value: string) => void;
  onSaveOverride: () => void;
  onToggleResourcePriceLock: (resourceId: string, checked: boolean) => void;
  overrideReason: string;
  overrideResourceId: string | null;
  overrideValue: string;
  quotesByResourceId: Record<string, RecursoProveedorPrecio[]>;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">Precios cliente</h2>
        <p className="mt-1 text-sm text-slate-500">
          Revisa automáticos, fallbacks y overrides antes de emitir.
        </p>
      </div>
      <div className="space-y-3 p-5">
        {draftResources.map((resource) => (
          <div className="rounded-xl border border-slate-200 p-3" key={resource.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{resource.nombre_snapshot}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {resource.precio_cliente_origen === "override_manual"
                    ? "Override manual"
                    : resource.precio_cliente_origen === "fallback_general"
                      ? "Fallback general"
                      : "Proveedor visible"}
                </p>
              </div>
              <button
                className="rounded-lg px-2 py-1 text-xs font-bold text-brand-600 hover:bg-blue-50"
                onClick={() => onEditOverride(resource)}
                type="button"
              >
                Override
              </button>
            </div>
            <div className="mt-3 grid gap-2">
              <label className="text-xs font-bold uppercase text-slate-500" htmlFor={`quote-${resource.id}`}>
                Cotización cliente
              </label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                disabled={isSaving || !resource.recurso_id}
                id={`quote-${resource.id}`}
                onChange={(event) => onClientQuoteSelect(resource.id, event.target.value)}
                value={resource.cotizacion_cliente_id || ""}
              >
                <option value="">Automatica sugerida</option>
                {(resource.recurso_id ? quotesByResourceId[resource.recurso_id] || [] : []).map((quote) => (
                  <option key={quote.id} value={quote.id}>
                    {(quote.proveedor?.nombre || "Proveedor")} - {formatCurrency(quote.costo_unitario + quote.costo_transporte)}
                  </option>
                ))}
              </select>
            </div>
            <label className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
              <span>{resource.precio_fijado ? "Precio interno fijado" : "Precio interno autoactualizable"}</span>
              <input
                checked={resource.precio_fijado}
                className="h-4 w-4"
                disabled={isSaving}
                onChange={(event) => onToggleResourcePriceLock(resource.id, event.target.checked)}
                type="checkbox"
              />
            </label>
            <p className="mt-2 text-sm font-bold text-slate-800">
              {formatCurrency(resource.precio_cliente_actual ?? resource.costo_unitario_actual + resource.costo_transporte_actual)}
            </p>
            {resource.precio_cliente_advertencia ? (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {resource.precio_cliente_advertencia}
              </p>
            ) : null}
            {overrideResourceId === resource.id ? (
              <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
                <input
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  min="0"
                  onChange={(event) => onOverrideValueChange(event.target.value)}
                  placeholder="Precio cliente"
                  step="0.01"
                  type="number"
                  value={overrideValue}
                />
                <input
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  onChange={(event) => onOverrideReasonChange(event.target.value)}
                  placeholder="Motivo del override"
                  value={overrideReason}
                />
                <div className="flex justify-end gap-2">
                  <Button disabled={isSaving} onClick={onCancelOverride} variant="secondary">
                    Cancelar
                  </Button>
                  <Button disabled={isSaving} onClick={onSaveOverride}>
                    Guardar
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
          <Button icon={FileSpreadsheet} onClick={onClientExcel} variant="secondary">
            Excel cliente
          </Button>
          <Button icon={FileText} onClick={onClientPdf} variant="secondary">
            PDF cliente
          </Button>
        </div>
      </div>
    </section>
  );
}

function DraftSettingsPanel({
  draftForm,
  isSaving,
  onChange,
  onSave
}: {
  draftForm: {
    cliente: string;
    gastos_generales_porcentaje: string;
    igv_porcentaje: string;
    nombre: string;
    ubicacion: string;
    utilidad_porcentaje: string;
  };
  isSaving: boolean;
  onChange: (field: keyof typeof draftForm, value: string) => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-950">Borrador</h2>
        <p className="mt-1 text-sm text-slate-500">Datos editables del presupuesto vivo.</p>
      </div>
      <div className="grid gap-3">
        <TextInput label="Nombre" onChange={(value) => onChange("nombre", value)} value={draftForm.nombre} />
        <TextInput label="Cliente" onChange={(value) => onChange("cliente", value)} value={draftForm.cliente} />
        <TextInput label="Ubicación" onChange={(value) => onChange("ubicacion", value)} value={draftForm.ubicacion} />
        <div className="grid grid-cols-3 gap-2">
          <TextInput label="G.G. %" onChange={(value) => onChange("gastos_generales_porcentaje", value)} type="number" value={draftForm.gastos_generales_porcentaje} />
          <TextInput label="Util. %" onChange={(value) => onChange("utilidad_porcentaje", value)} type="number" value={draftForm.utilidad_porcentaje} />
          <TextInput label="IGV %" onChange={(value) => onChange("igv_porcentaje", value)} type="number" value={draftForm.igv_porcentaje} />
        </div>
        <Button disabled={isSaving} onClick={onSave} variant="secondary">
          Guardar borrador
        </Button>
      </div>
    </section>
  );
}

function TextInput({
  label,
  onChange,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  type?: "number" | "text";
  value: string;
}) {
  return (
    <label className="grid gap-1 text-xs font-bold uppercase text-slate-500">
      {label}
      <input
        className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        min={type === "number" ? 0 : undefined}
        onChange={(event) => onChange(event.target.value)}
        step={type === "number" ? 0.01 : undefined}
        type={type}
        value={value}
      />
    </label>
  );
}

function draftToBudget(draft: PresupuestoBorrador): Presupuesto {
  return {
    cliente: draft.cliente,
    created_at: draft.created_at,
    estado: "borrador",
    gastos_generales_porcentaje: draft.gastos_generales_porcentaje,
    gastos_generales_total: draft.gastos_generales_total,
    id: draft.id,
    igv_porcentaje: draft.igv_porcentaje,
    igv_total: draft.igv_total,
    moneda: draft.moneda,
    proyecto_nombre: draft.nombre,
    subtotal: draft.subtotal,
    subtotal_con_margen: draft.subtotal_con_margen,
    total: draft.total,
    ubicacion: draft.ubicacion,
    updated_at: draft.updated_at,
    utilidad_porcentaje: draft.utilidad_porcentaje,
    utilidad_total: draft.utilidad_total,
    version: "Borrador activo"
  };
}

function draftLineToBudgetLine(line: PresupuestoBorradorPartida): PresupuestoPartida {
  return {
    categoria_snapshot: line.categoria_snapshot,
    codigo_snapshot: line.codigo_snapshot,
    cuadrilla_snapshot: line.cuadrilla_snapshot,
    descripcion_snapshot: line.descripcion_snapshot,
    especificaciones_snapshot: line.especificaciones_snapshot,
    id: line.id,
    metrado: line.metrado,
    nombre_snapshot: line.nombre_snapshot,
    orden: line.orden,
    parcial: line.parcial,
    partida_id: line.partida_id,
    presupuesto_id: line.presupuesto_borrador_id,
    precio_unitario_snapshot: line.precio_unitario_actual,
    rendimiento_snapshot: line.rendimiento_snapshot,
    unidad_snapshot: line.unidad_snapshot
  } as PresupuestoPartida;
}

function draftResourceToSnapshot(
  resource: PresupuestoBorradorPartidaRecurso
): PresupuestoPartidaRecursoSnapshot {
  return {
    cantidad: resource.cantidad,
    costo_transporte_snapshot: resource.costo_transporte_actual,
    costo_unitario_snapshot: resource.costo_unitario_actual,
    desperdicio_porcentaje: resource.desperdicio_porcentaje,
    fecha_precio_snapshot: resource.fecha_precio_snapshot,
    fuente_precio_snapshot: resource.fuente_precio_snapshot,
    grupo: resource.grupo,
    id: resource.id,
    nombre_snapshot: resource.nombre_snapshot,
    orden: resource.orden,
    parcial_snapshot: resource.parcial_actual,
    partida_recurso_id: resource.partida_recurso_id || "",
    presupuesto_id: resource.presupuesto_borrador_id,
    presupuesto_partida_id: resource.presupuesto_borrador_partida_id,
    proveedor_id_snapshot: resource.proveedor_id_snapshot,
    proveedor_nombre_snapshot: resource.proveedor_nombre_snapshot,
    recurso_id: resource.recurso_id || "",
    rendimiento_factor: resource.rendimiento_factor,
    tipo_snapshot: resource.tipo_snapshot,
    unidad: resource.unidad,
    unidad_snapshot: resource.unidad_snapshot
  };
}

function errorMessage(error: DataError) {
  if (error.code === "permission") {
    return "No tienes permisos para realizar esta acción.";
  }

  if (error.code === "conflict") {
    return "El presupuesto entra en conflicto con un registro existente.";
  }

  return error.message;
}

function getPersistedUpdatedAt(error: DataError) {
  return isOptimisticConflict(error) && "updated_at" in (error.details.persisted as Record<string, unknown>)
    ? String((error.details.persisted as { updated_at: string }).updated_at)
    : undefined;
}

function groupQuotesForUi(quotes: RecursoProveedorPrecio[]) {
  return quotes.reduce<Record<string, RecursoProveedorPrecio[]>>((groups, quote) => {
    groups[quote.recurso_id] = [...(groups[quote.recurso_id] || []), quote];
    return groups;
  }, {});
}

function firstFormError(errors: Partial<Record<string, string>>) {
  return Object.values(errors).find(Boolean);
}
