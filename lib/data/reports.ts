import type {
  GrupoApu,
  PresupuestoBorrador,
  PresupuestoBorradorPartidaRecurso,
  PresupuestoVersion,
  PresupuestoVersionPartidaRecurso,
  TipoRecurso
} from "../../types/domain";

import { roundMoney } from "../calculations/money";

import { listBudgetDashboardProjects } from "./budgets";
import type { BudgetDashboardProject } from "./budgets";
import { dataFailure, dataSuccess, normalizeSupabaseError } from "./errors";
import { validateDataScope } from "./scope";
import type { DataClient, DataResult, DataScope } from "./types";

export type ReportSourceType = "official" | "draft";

export type ReportBudgetSummary = {
  cliente: string | null;
  estado: BudgetDashboardProject["estado"];
  fechaReferencia: string;
  fuente: ReportSourceType;
  fuenteId: string | null;
  id: string;
  partidasTotal: number;
  proyectoNombre: string;
  subtotal: number;
  total: number;
  ubicacion: string | null;
  versionLabel: string;
};

export type ReportGroupCost = {
  grupo: GrupoApu;
  label: string;
  percentage: number;
  total: number;
};

export type ReportResourceCost = {
  grupo: GrupoApu;
  nombre: string;
  percentage: number;
  tipo: TipoRecurso;
  total: number;
  unidad: string;
  usos: number;
};

export type ReportStateTotal = {
  estado: BudgetDashboardProject["estado"];
  label: string;
  proyectos: number;
  total: number;
};

export type ReportsDashboard = {
  budgetSummaries: ReportBudgetSummary[];
  groupCosts: ReportGroupCost[];
  resourceCosts: ReportResourceCost[];
  stateTotals: ReportStateTotal[];
  totals: {
    borradores: number;
    oficiales: number;
    proyectos: number;
    subtotal: number;
    total: number;
  };
};

type LatestVersionByProject = Map<string, PresupuestoVersion>;
type DraftByProject = Map<string, PresupuestoBorrador>;
type ReportResourceRow = {
  grupo: GrupoApu;
  nombre_snapshot: string;
  parcial: number;
  tipo_snapshot: TipoRecurso;
  unidad_snapshot: string;
};

const groupLabels: Record<GrupoApu, string> = {
  equipos_herramientas: "Equipos y herramientas",
  mano_obra: "Mano de obra",
  materiales: "Materiales"
};

const stateLabels: Record<BudgetDashboardProject["estado"], string> = {
  aprobado: "Oficial",
  archivado: "Archivado",
  borrador: "Borrador"
};

const groupOrder: GrupoApu[] = ["materiales", "mano_obra", "equipos_herramientas"];

export async function getReportsDashboard(
  client: DataClient,
  scope: DataScope
): Promise<DataResult<ReportsDashboard>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const projectsResult = await listBudgetDashboardProjects(client, scopeResult.data);

  if (!projectsResult.ok) {
    return projectsResult;
  }

  const projects = projectsResult.data;
  const projectIds = projects.map((project) => project.id);

  if (projectIds.length === 0) {
    return dataSuccess(buildReportsDashboard(projects, new Map(), new Map(), []));
  }

  const [versionsResult, draftsResult] = await Promise.all([
    client
      .from("presupuesto_versiones")
      .select("*")
      .eq("organizacion_id", scopeResult.data.organizacionId)
      .in("proyecto_id", projectIds)
      .eq("estado", "emitida")
      .order("numero_version", { ascending: false }),
    client
      .from("presupuesto_borradores")
      .select("*")
      .eq("organizacion_id", scopeResult.data.organizacionId)
      .in("proyecto_id", projectIds)
      .eq("estado", "activo")
  ]);

  if (versionsResult.error) {
    return dataFailure(normalizeSupabaseError(versionsResult.error, "reportes.versiones.list"));
  }

  if (draftsResult.error) {
    return dataFailure(normalizeSupabaseError(draftsResult.error, "reportes.borradores.list"));
  }

  const latestVersions = mapLatestVersionsByProject((versionsResult.data || []) as PresupuestoVersion[]);
  const activeDrafts = mapDraftsByProject((draftsResult.data || []) as PresupuestoBorrador[]);
  const selectedOfficialVersionIds = Array.from(latestVersions.values()).map((version) => version.id);
  const fallbackDraftIds = projects
    .filter((project) => !latestVersions.has(project.id))
    .map((project) => activeDrafts.get(project.id)?.id)
    .filter((id): id is string => Boolean(id));

  const reportResourcesResult = await loadReportResources(
    client,
    selectedOfficialVersionIds,
    fallbackDraftIds
  );

  if (!reportResourcesResult.ok) {
    return reportResourcesResult;
  }

  return dataSuccess(buildReportsDashboard(projects, latestVersions, activeDrafts, reportResourcesResult.data));
}

export function buildReportsDashboard(
  projects: BudgetDashboardProject[],
  latestVersions: LatestVersionByProject,
  activeDrafts: DraftByProject,
  resources: ReportResourceRow[]
): ReportsDashboard {
  const budgetSummaries = projects.map((project) => {
    const version = latestVersions.get(project.id);
    const draft = activeDrafts.get(project.id);
    const fuente = version ? "official" : "draft";

    return {
      cliente: project.cliente,
      estado: project.estado,
      fechaReferencia: version?.emitida_at || draft?.updated_at || project.updated_at,
      fuente,
      fuenteId: version?.id || draft?.id || null,
      id: project.id,
      partidasTotal: project.partidasTotal,
      proyectoNombre: project.proyecto_nombre,
      subtotal: roundMoney(project.subtotal),
      total: roundMoney(project.total),
      ubicacion: project.ubicacion,
      versionLabel: version ? `V${version.numero_version} oficial` : draft ? "Borrador activo" : "Sin presupuesto"
    } satisfies ReportBudgetSummary;
  });

  const subtotal = roundMoney(budgetSummaries.reduce((total, project) => total + project.subtotal, 0));
  const total = roundMoney(budgetSummaries.reduce((sum, project) => sum + project.total, 0));
  const groupCosts = aggregateGroupCosts(resources);
  const resourceCosts = aggregateResourceCosts(resources).slice(0, 8);
  const stateTotals = aggregateStateTotals(budgetSummaries);

  return {
    budgetSummaries,
    groupCosts,
    resourceCosts,
    stateTotals,
    totals: {
      borradores: budgetSummaries.filter((project) => project.fuente === "draft").length,
      oficiales: budgetSummaries.filter((project) => project.fuente === "official").length,
      proyectos: budgetSummaries.length,
      subtotal,
      total
    }
  };
}

export function aggregateGroupCosts(resources: ReportResourceRow[]): ReportGroupCost[] {
  const totals = new Map<GrupoApu, number>();
  const grandTotal = resources.reduce((total, resource) => total + resource.parcial, 0);

  for (const resource of resources) {
    totals.set(resource.grupo, roundMoney((totals.get(resource.grupo) || 0) + resource.parcial));
  }

  return groupOrder.map((grupo) => {
    const total = roundMoney(totals.get(grupo) || 0);

    return {
      grupo,
      label: groupLabels[grupo],
      percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
      total
    };
  });
}

export function aggregateResourceCosts(resources: ReportResourceRow[]): ReportResourceCost[] {
  const totals = new Map<string, ReportResourceCost>();
  const grandTotal = resources.reduce((total, resource) => total + resource.parcial, 0);

  for (const resource of resources) {
    const key = `${resource.nombre_snapshot}|${resource.tipo_snapshot}|${resource.unidad_snapshot}|${resource.grupo}`;
    const current = totals.get(key);

    if (!current) {
      totals.set(key, {
        grupo: resource.grupo,
        nombre: resource.nombre_snapshot,
        percentage: 0,
        tipo: resource.tipo_snapshot,
        total: roundMoney(resource.parcial),
        unidad: resource.unidad_snapshot,
        usos: 1
      });
      continue;
    }

    current.total = roundMoney(current.total + resource.parcial);
    current.usos += 1;
  }

  return Array.from(totals.values())
    .map((resource) => ({
      ...resource,
      percentage: grandTotal > 0 ? Math.round((resource.total / grandTotal) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, "es"));
}

export function aggregateStateTotals(projects: ReportBudgetSummary[]): ReportStateTotal[] {
  const totals = new Map<BudgetDashboardProject["estado"], ReportStateTotal>();

  for (const project of projects) {
    const current = totals.get(project.estado) || {
      estado: project.estado,
      label: stateLabels[project.estado],
      proyectos: 0,
      total: 0
    };

    current.proyectos += 1;
    current.total = roundMoney(current.total + project.total);
    totals.set(project.estado, current);
  }

  return Array.from(totals.values()).sort((a, b) => b.total - a.total);
}

async function loadReportResources(
  client: DataClient,
  officialVersionIds: string[],
  draftIds: string[]
): Promise<DataResult<ReportResourceRow[]>> {
  const [versionResourcesResult, draftResourcesResult] = await Promise.all([
    officialVersionIds.length > 0
      ? client
          .from("presupuesto_version_partida_recursos")
          .select("grupo,nombre_snapshot,parcial_snapshot,tipo_snapshot,unidad_snapshot")
          .in("presupuesto_version_id", officialVersionIds)
      : Promise.resolve({ data: [], error: null }),
    draftIds.length > 0
      ? client
          .from("presupuesto_borrador_partida_recursos")
          .select("grupo,nombre_snapshot,parcial_actual,tipo_snapshot,unidad_snapshot")
          .in("presupuesto_borrador_id", draftIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (versionResourcesResult.error) {
    return dataFailure(normalizeSupabaseError(versionResourcesResult.error, "reportes.versionResources.list"));
  }

  if (draftResourcesResult.error) {
    return dataFailure(normalizeSupabaseError(draftResourcesResult.error, "reportes.draftResources.list"));
  }

  const versionResources = ((versionResourcesResult.data || []) as Pick<
    PresupuestoVersionPartidaRecurso,
    "grupo" | "nombre_snapshot" | "parcial_snapshot" | "tipo_snapshot" | "unidad_snapshot"
  >[]).map((resource) => ({
    grupo: resource.grupo,
    nombre_snapshot: resource.nombre_snapshot,
    parcial: resource.parcial_snapshot,
    tipo_snapshot: resource.tipo_snapshot,
    unidad_snapshot: resource.unidad_snapshot
  }));
  const draftResources = ((draftResourcesResult.data || []) as Pick<
    PresupuestoBorradorPartidaRecurso,
    "grupo" | "nombre_snapshot" | "parcial_actual" | "tipo_snapshot" | "unidad_snapshot"
  >[]).map((resource) => ({
    grupo: resource.grupo,
    nombre_snapshot: resource.nombre_snapshot,
    parcial: resource.parcial_actual,
    tipo_snapshot: resource.tipo_snapshot,
    unidad_snapshot: resource.unidad_snapshot
  }));

  return dataSuccess([...versionResources, ...draftResources]);
}

function mapLatestVersionsByProject(versions: PresupuestoVersion[]): LatestVersionByProject {
  const latestVersions = new Map<string, PresupuestoVersion>();

  for (const version of versions) {
    const current = latestVersions.get(version.proyecto_id);

    if (!current || version.numero_version > current.numero_version) {
      latestVersions.set(version.proyecto_id, version);
    }
  }

  return latestVersions;
}

function mapDraftsByProject(drafts: PresupuestoBorrador[]): DraftByProject {
  return new Map(drafts.map((draft) => [draft.proyecto_id, draft]));
}
