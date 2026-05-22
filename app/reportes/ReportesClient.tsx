"use client";

import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileText,
  Layers3,
  RefreshCcw,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import type { ElementType } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { ActivityToasts } from "@/components/shared/ActivityToasts";
import { Button } from "@/components/shared/Button";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCurrency } from "@/components/presupuestos/budget-ui";
import { formatDisplayDate } from "@/lib/format/date";
import { getReportsDashboard, type ReportsDashboard } from "@/lib/data/reports";
import type { DataScope } from "@/lib/data/types";
import { resolveOrganizationWorkspace } from "@/lib/data/workspace";
import { useActivitySubscription } from "@/lib/realtime/useActivitySubscription";
import { createBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const sourceTone = {
  draft: "bg-amber-50 text-amber-700 ring-amber-200",
  official: "bg-emerald-50 text-emerald-700 ring-emerald-200"
};

export default function ReportesClient() {
  const [reports, setReports] = useState<ReportsDashboard | null>(null);
  const [scope, setScope] = useState<DataScope | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

    const result = await getReportsDashboard(supabase, workspaceResult.data.scope);

    if (!result.ok) {
      setLoadError(result.error.message);
      setIsLoading(false);
      return;
    }

    setScope(workspaceResult.data.scope);
    setReports(result.data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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

  if (isLoading) {
    return (
      <AppLayout>
        <ActivityToasts
          onDismiss={activity.dismissToast}
          status={activity.status}
          toasts={activity.toasts}
        />
        <div className="mx-auto w-full max-w-[1680px] px-5 py-6 lg:px-8">
          <LoadingState label="Cargando reportes" rows={7} />
        </div>
      </AppLayout>
    );
  }

  if (loadError) {
    return (
      <AppLayout>
        <ActivityToasts
          onDismiss={activity.dismissToast}
          status={activity.status}
          toasts={activity.toasts}
        />
        <div className="mx-auto w-full max-w-[1680px] px-5 py-6 lg:px-8">
          <EmptyState
            action={<Button icon={RefreshCcw} onClick={() => void loadData()} variant="secondary">Reintentar</Button>}
            description={loadError}
            title="No se pudieron cargar los reportes"
          />
        </div>
      </AppLayout>
    );
  }

  const data = reports;

  return (
    <AppLayout>
      <ActivityToasts
        onDismiss={activity.dismissToast}
        status={activity.status}
        toasts={activity.toasts}
      />
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-5 py-6 lg:px-8">
        <PageHeader
          actions={
            <>
              <Button icon={RefreshCcw} onClick={() => void loadData()} variant="secondary">
                Recargar
              </Button>
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-brand-700"
                href="/presupuestos"
              >
                Abrir presupuestos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          }
          description="Reportes de lectura para revisar presupuestos vigentes: se usa la ultima version oficial cuando existe y, si no, el borrador activo."
          eyebrow="Reportes MVP"
          title="Resumen ejecutivo de costos"
        />

        {!data || data.budgetSummaries.length === 0 ? (
          <EmptyState
            action={
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition hover:bg-brand-700"
                href="/presupuestos"
              >
                Ir a presupuestos
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
            description="Todavia no hay presupuestos accesibles para generar reportes."
            title="No hay datos para reportar"
          />
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                detail={`${data.totals.oficiales} oficiales, ${data.totals.borradores} borradores`}
                icon={ClipboardList}
                label="Presupuestos reportados"
                value={String(data.totals.proyectos)}
              />
              <MetricCard
                detail="Suma de costos directos antes de margenes"
                icon={WalletCards}
                label="Subtotal acumulado"
                value={formatCurrency(data.totals.subtotal)}
              />
              <MetricCard
                detail="Incluye gastos generales, utilidad e IGV"
                icon={BarChart3}
                label="Total acumulado"
                value={formatCurrency(data.totals.total)}
              />
              <MetricCard
                detail={data.resourceCosts[0]?.nombre || "Sin recursos registrados"}
                icon={Layers3}
                label="Recurso mas costoso"
                value={data.resourceCosts[0] ? formatCurrency(data.resourceCosts[0].total) : formatCurrency(0)}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
              <DataTable
                description="Cada proyecto prioriza su version oficial mas reciente; los borradores quedan identificados como datos vivos."
                minWidth={900}
                title="Resumen por presupuesto"
              >
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
                    <th scope="col" className="px-4 py-3">Proyecto</th>
                    <th scope="col" className="px-4 py-3">Fuente</th>
                    <th scope="col" className="px-4 py-3 text-right">Subtotal</th>
                    <th scope="col" className="px-4 py-3 text-right">Total</th>
                    <th scope="col" className="px-4 py-3 text-center">Partidas</th>
                    <th scope="col" className="px-4 py-3 text-right">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {data.budgetSummaries.map((budget) => (
                    <tr className="border-b border-slate-100 last:border-b-0" key={budget.id}>
                      <td className="px-4 py-4">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="font-bold text-slate-950">{budget.proyectoNombre}</span>
                          <span className="text-xs text-slate-500">
                            {budget.cliente || "Sin cliente"} - {budget.ubicacion || "Sin ubicacion"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1", sourceTone[budget.fuente])}>
                          {budget.versionLabel}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {formatDisplayDate(budget.fechaReferencia)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-800">
                        {formatCurrency(budget.subtotal)}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-slate-950">
                        {formatCurrency(budget.total)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex min-w-12 justify-center rounded-xl bg-slate-100 px-3 py-2 font-bold text-slate-700">
                          {budget.partidasTotal}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-brand-600"
                          href={`/presupuestos/${budget.id}`}
                        >
                          Ver detalle
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>

              <div className="grid gap-6">
                <BreakdownPanel
                  description="Distribucion acumulada desde recursos APU de versiones oficiales o borradores activos."
                  rows={data.groupCosts}
                  title="Costos por grupo APU"
                />
                <StateTotalsPanel rows={data.stateTotals} />
              </div>
            </section>

            <DataTable
              description="Recursos agrupados por nombre snapshot, tipo, unidad y grupo APU."
              isEmpty={data.resourceCosts.length === 0}
              emptyState={<EmptyState description="Agrega partidas con recursos APU para ver el ranking." title="Sin recursos reportables" />}
              minWidth={780}
              title="Recursos mas costosos"
            >
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
                  <th scope="col" className="px-4 py-3">Recurso</th>
                  <th scope="col" className="px-4 py-3">Grupo</th>
                  <th scope="col" className="px-4 py-3">Tipo</th>
                  <th scope="col" className="px-4 py-3 text-center">Usos</th>
                  <th scope="col" className="px-4 py-3">Participacion</th>
                  <th scope="col" className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.resourceCosts.map((resource) => (
                  <tr className="border-b border-slate-100 last:border-b-0" key={`${resource.nombre}-${resource.tipo}-${resource.unidad}-${resource.grupo}`}>
                    <td className="px-4 py-4">
                      <span className="font-bold text-slate-950">{resource.nombre}</span>
                      <span className="mt-1 block text-xs text-slate-500">Unidad: {resource.unidad}</span>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700">{formatGroup(resource.grupo)}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{formatResourceType(resource.tipo)}</td>
                    <td className="px-4 py-4 text-center font-bold text-slate-800">{resource.usos}</td>
                    <td className="px-4 py-4">
                      <ProgressBar percentage={resource.percentage} tone="blue" />
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-slate-950">{formatCurrency(resource.total)}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </>
        )}
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
          <p className="mt-2 whitespace-nowrap text-lg font-bold leading-tight text-slate-950 2xl:text-xl">{value}</p>
          <p className="mt-2 text-sm leading-5 text-slate-500">{detail}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function BreakdownPanel({
  description,
  rows,
  title
}: {
  description: string;
  rows: ReportsDashboard["groupCosts"];
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <div className="space-y-2" key={row.grupo}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-slate-800">{row.label}</span>
              <span className="font-bold text-slate-950">{formatCurrency(row.total)}</span>
            </div>
            <ProgressBar percentage={row.percentage} tone={row.grupo === "materiales" ? "amber" : "blue"} />
          </div>
        ))}
      </div>
    </section>
  );
}

function StateTotalsPanel({ rows }: { rows: ReportsDashboard["stateTotals"] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <BarChart3 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Totales por estado</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            Separacion simple entre presupuestos oficiales y borradores vivos.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin estados reportables.</p>
        ) : (
          rows.map((row) => (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3" key={row.estado}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-slate-800">{row.label}</span>
                <span className="text-sm font-bold text-slate-950">{formatCurrency(row.total)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {row.proyectos} {row.proyectos === 1 ? "proyecto" : "proyectos"}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ProgressBar({ percentage, tone }: { percentage: number; tone: "amber" | "blue" }) {
  const barClass = tone === "amber" ? "bg-construction-500" : "bg-brand-600";

  return (
    <div className="min-w-[150px]">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-500">Participacion</span>
        <span className="font-bold text-slate-900">{percentage}%</span>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-slate-100">
        <div className={cn("h-2.5 rounded-full", barClass)} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    </div>
  );
}

function formatGroup(value: string) {
  const labels: Record<string, string> = {
    equipos_herramientas: "Equipos y herramientas",
    mano_obra: "Mano de obra",
    materiales: "Materiales"
  };

  return labels[value] || value;
}

function formatResourceType(value: string) {
  const labels: Record<string, string> = {
    equipo: "Equipo",
    herramienta: "Herramienta",
    mano_obra: "Mano de obra",
    material: "Material"
  };

  return labels[value] || value;
}
