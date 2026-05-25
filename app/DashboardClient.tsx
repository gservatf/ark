"use client";

import {
  ArrowRight,
  BarChart3,
  Banknote,
  ClipboardList,
  FileSpreadsheet,
  Gauge,
  Plus,
  RefreshCcw,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ElementType } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency } from "@/components/presupuestos/budget-ui";
import { ProjectCreateDialog } from "@/components/projects/ProjectCreateDialog";
import { Button } from "@/components/shared/Button";
import { ActivityToasts } from "@/components/shared/ActivityToasts";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import { listBudgetDashboardProjects, type BudgetDashboardProject } from "@/lib/data/budgets";
import { createProject } from "@/lib/data/projects";
import type { DataScope } from "@/lib/data/types";
import { resolveOrganizationWorkspace } from "@/lib/data/workspace";
import { useActivitySubscription } from "@/lib/realtime/useActivitySubscription";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { ProjectInput } from "@/lib/validations/projects";

export default function HomePage() {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<BudgetDashboardProject[]>([]);
  const [scope, setScope] = useState<DataScope | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  const [localToasts, setLocalToasts] = useState<Array<{ description: string; id: string; title: string }>>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const supabase = createBrowserClient();
    const workspaceResult = await resolveOrganizationWorkspace(supabase);

    if (!workspaceResult.ok) {
      setLoadError(workspaceResult.error.message);
      setIsLoading(false);
      return;
    }

    const scope = workspaceResult.data.scope;
    const result = await listBudgetDashboardProjects(supabase, scope);

    if (!result.ok) {
      setLoadError(result.error.message);
      setIsLoading(false);
      return;
    }

    setScope(scope);
    setProjects(result.data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);

    if (currentParams.get("auth") !== "password-updated") {
      return;
    }

    setLocalToasts((current) => [
      ...current.filter((toast) => toast.id !== "password-updated"),
      {
        description: "Tu nueva contrasena quedo guardada correctamente.",
        id: "password-updated",
        title: "Contrasena actualizada"
      }
    ]);

    currentParams.delete("auth");
    const nextSearch = currentParams.toString();
    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, { scroll: false });
  }, [pathname, router]);

  const activityTopic = useMemo(
    () => (scope ? { organizacionId: scope.organizacionId, type: "org" as const } : undefined),
    [scope]
  );
  const activity = useActivitySubscription({
    currentActorId: scope?.actorId,
    enabled: Boolean(scope),
    onRefetch: loadData,
    topicScope: activityTopic
  });
  const toasts = useMemo(() => [...localToasts, ...activity.toasts], [activity.toasts, localToasts]);
  const dismissToast = useCallback(
    (id: string) => {
      setLocalToasts((current) => current.filter((toast) => toast.id !== id));
      activity.dismissToast(id);
    },
    [activity]
  );

  const handleCreateProject = useCallback(
    async (input: ProjectInput) => {
      if (!scope) {
        setCreateProjectError("No se encontro una organizacion activa.");
        return;
      }

      setIsCreatingProject(true);
      setCreateProjectError(null);
      const supabase = createBrowserClient();
      const result = await createProject(supabase, scope, input);
      setIsCreatingProject(false);

      if (!result.ok) {
        setCreateProjectError(result.error.message);
        return;
      }

      setIsCreateProjectOpen(false);
      await loadData();
      router.push(`/presupuestos/${result.data.id}`);
      router.refresh();
    },
    [loadData, router, scope]
  );

  const totals = useMemo(() => {
    const totalBudget = projects.reduce((total, project) => total + project.total, 0);
    const totalSpent = projects.reduce((total, project) => total + project.gastoEjecutado, 0);
    const totalLines = projects.reduce((total, project) => total + project.partidasTotal, 0);
    const completedLines = projects.reduce((total, project) => total + project.partidasCompletadas, 0);

    return {
      averageProgress: totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0,
      completedLines,
      spentPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      totalBudget,
      totalLines,
      totalSpent
    };
  }, [projects]);

  if (isLoading) {
    return (
      <AppLayout>
        <ActivityToasts
          onDismiss={dismissToast}
          status={activity.status}
          toasts={toasts}
        />
        <div className="mx-auto w-full max-w-[1680px] px-5 py-6 lg:px-8">
          <LoadingState label="Cargando dashboard" rows={6} />
        </div>
      </AppLayout>
    );
  }

  if (loadError) {
    return (
      <AppLayout>
        <ActivityToasts
          onDismiss={dismissToast}
          status={activity.status}
          toasts={toasts}
        />
        <div className="mx-auto w-full max-w-[1680px] px-5 py-6 lg:px-8">
          <EmptyState
            action={<Button icon={RefreshCcw} onClick={() => void loadData()} variant="secondary">Reintentar</Button>}
            description={loadError}
            title="No se pudo cargar el dashboard"
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ActivityToasts
        onDismiss={dismissToast}
        status={activity.status}
        toasts={toasts}
      />
      <ProjectCreateDialog
        error={createProjectError}
        isSubmitting={isCreatingProject}
        onClose={() => setIsCreateProjectOpen(false)}
        onSubmit={handleCreateProject}
        open={isCreateProjectOpen}
      />
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-5 py-6 lg:px-8">
        <PageHeader
          actions={
            <>
              <Button icon={Plus} onClick={() => setIsCreateProjectOpen(true)} variant="secondary">
                Nuevo proyecto
              </Button>
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-brand-600"
                href="/reportes"
              >
                <BarChart3 className="h-4 w-4" />
                Ver reportes
              </Link>
              {projects[0] ? (
                <Link
                  className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-brand-700"
                  href={`/presupuestos/${projects[0].id}`}
                >
                  Abrir presupuestos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </>
          }
          description="Vista persistente de proyectos: muestra la última versión oficial o, si todavía no existe, el borrador activo."
          eyebrow="Dashboard general"
          title="Proyectos y presupuestos"
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={ClipboardList}
            label="Presupuestos activos"
            value={String(projects.length)}
            detail="Proyectos accesibles por permisos"
          />
          <MetricCard
            icon={Banknote}
            label="Presupuesto total"
            value={formatCurrency(totals.totalBudget)}
            detail="Suma total con IGV"
          />
          <MetricCard
            icon={Gauge}
            label="Avance promedio"
            value={`${totals.averageProgress}%`}
            detail={`${totals.completedLines} de ${totals.totalLines} partidas completadas`}
          />
          <MetricCard
            icon={WalletCards}
            label="Gasto ejecutado"
            value={formatCurrency(totals.totalSpent)}
            detail={`${totals.spentPercentage}% del presupuesto total`}
          />
        </section>

        <DataTable
          actions={<Button className="h-9 px-3" icon={RefreshCcw} onClick={() => void loadData()} variant="secondary">Recargar</Button>}
          description="Cada fila resume el estado economico del presupuesto vigente del proyecto."
          emptyState={
            <EmptyState
              action={
                <Button icon={Plus} onClick={() => setIsCreateProjectOpen(true)}>
                  Crear nuevo proyecto
                </Button>
              }
              description="Tu espacio de trabajo esta listo. Crea el primer proyecto para empezar a armar presupuestos."
              title="Todavia no tienes proyectos"
            />
          }
          isEmpty={projects.length === 0}
          minWidth={880}
          title="Dashboard de proyectos"
        >
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
              <th scope="col" className="px-4 py-3">Proyecto</th>
              <th scope="col" className="px-4 py-3 text-right">Presupuesto total</th>
              <th scope="col" className="px-4 py-3 text-center">Partidas</th>
              <th scope="col" className="px-4 py-3">Avance</th>
              <th scope="col" className="px-4 py-3">Gasto ejecutado</th>
              <th scope="col" className="px-4 py-3 text-right">Accion</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr className="border-b border-slate-100 last:border-b-0" key={project.id}>
                <td className="px-4 py-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900">{project.proyecto_nombre}</span>
                      <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-brand-600">
                        {project.version}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {project.cliente || "Sin cliente"} - {project.ubicacion || "Sin ubicacion"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="font-bold text-slate-950">{formatCurrency(project.total)}</span>
                  <span className="mt-1 block text-xs text-slate-500">Subtotal {formatCurrency(project.subtotal)}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 font-bold text-slate-700">
                    <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                    {project.partidasTotal}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <ProgressSummary
                    label={`${project.partidasCompletadas} de ${project.partidasTotal} partidas`}
                    percentage={project.partidasTotal > 0 ? project.gastoPorcentaje : 0}
                    tone="blue"
                  />
                </td>
                <td className="px-4 py-4">
                  <ProgressSummary label={formatCurrency(project.gastoEjecutado)} percentage={project.gastoPorcentaje} tone="green" />
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-brand-600"
                    href={`/presupuestos/${project.id}`}
                  >
                    Ver detalle
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>
    </AppLayout>
  );
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  value
}: {
  detail: string;
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-5 text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-bold text-slate-950 2xl:text-2xl">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{detail}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function ProgressSummary({
  label,
  percentage,
  tone
}: {
  label: string;
  percentage: number;
  tone: "blue" | "green";
}) {
  const barClass = tone === "green" ? "bg-emerald-500" : "bg-brand-600";

  return (
    <div className="min-w-[150px]">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="font-bold text-slate-900">{percentage}%</span>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-slate-100">
        <div className={`h-2.5 rounded-full ${barClass}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    </div>
  );
}
