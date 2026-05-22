import { describe, expect, it } from "vitest";

import {
  aggregateGroupCosts,
  aggregateResourceCosts,
  aggregateStateTotals,
  buildReportsDashboard
} from "./reports";
import type { BudgetDashboardProject } from "./budgets";
import type { PresupuestoBorrador, PresupuestoVersion } from "../../types/domain";

describe("reports aggregation", () => {
  it("prioriza version oficial sobre borrador activo en resumen", () => {
    const dashboard = buildReportsDashboard(
      [createProject({ id: "project-1", total: 1200 })],
      new Map([["project-1", createVersion({ numero_version: 2, proyecto_id: "project-1" })]]),
      new Map([["project-1", createDraft({ proyecto_id: "project-1" })]]),
      []
    );

    expect(dashboard.budgetSummaries[0]).toEqual(
      expect.objectContaining({
        fuente: "official",
        versionLabel: "V2 oficial"
      })
    );
    expect(dashboard.totals.oficiales).toBe(1);
    expect(dashboard.totals.borradores).toBe(0);
  });

  it("marca borrador activo cuando no existe version oficial", () => {
    const dashboard = buildReportsDashboard(
      [createProject({ estado: "borrador", id: "project-1" })],
      new Map(),
      new Map([["project-1", createDraft({ proyecto_id: "project-1" })]]),
      []
    );

    expect(dashboard.budgetSummaries[0]).toEqual(
      expect.objectContaining({
        fuente: "draft",
        versionLabel: "Borrador activo"
      })
    );
  });

  it("agrega costos por grupo APU con porcentajes", () => {
    const costs = aggregateGroupCosts([
      createResource({ grupo: "materiales", parcial: 70 }),
      createResource({ grupo: "mano_obra", parcial: 20 }),
      createResource({ grupo: "equipos_herramientas", parcial: 10 })
    ]);

    expect(costs).toEqual([
      expect.objectContaining({ grupo: "materiales", percentage: 70, total: 70 }),
      expect.objectContaining({ grupo: "mano_obra", percentage: 20, total: 20 }),
      expect.objectContaining({ grupo: "equipos_herramientas", percentage: 10, total: 10 })
    ]);
  });

  it("agrupa recursos mas costosos por nombre, tipo, unidad y grupo", () => {
    const resources = aggregateResourceCosts([
      createResource({ nombre_snapshot: "Cemento", parcial: 40 }),
      createResource({ nombre_snapshot: "Cemento", parcial: 60 }),
      createResource({ nombre_snapshot: "Cuadrilla", parcial: 25, tipo_snapshot: "mano_obra" })
    ]);

    expect(resources[0]).toEqual(
      expect.objectContaining({
        nombre: "Cemento",
        percentage: 80,
        total: 100,
        usos: 2
      })
    );
    expect(resources[1]).toEqual(expect.objectContaining({ nombre: "Cuadrilla", total: 25 }));
  });

  it("agrega totales por estado del proyecto", () => {
    const totals = aggregateStateTotals([
      createSummary({ estado: "aprobado", total: 1000 }),
      createSummary({ estado: "aprobado", total: 500 }),
      createSummary({ estado: "borrador", total: 300 })
    ]);

    expect(totals).toEqual([
      expect.objectContaining({ estado: "aprobado", proyectos: 2, total: 1500 }),
      expect.objectContaining({ estado: "borrador", proyectos: 1, total: 300 })
    ]);
  });
});

function createProject(overrides: Partial<BudgetDashboardProject> = {}): BudgetDashboardProject {
  return {
    cliente: "Cliente Demo",
    estado: "aprobado",
    gastoEjecutado: 0,
    gastoPorcentaje: 0,
    id: "project-1",
    partidasCompletadas: 0,
    partidasTotal: 2,
    proyecto_nombre: "Proyecto Demo",
    subtotal: 1000,
    total: 1180,
    ubicacion: "Lima",
    updated_at: "2026-05-20",
    version: "V1 oficial",
    ...overrides
  };
}

function createVersion(overrides: Partial<PresupuestoVersion> = {}): PresupuestoVersion {
  return {
    cliente: "Cliente Demo",
    created_at: "2026-05-20",
    emitida_at: "2026-05-21",
    emitida_por: "user-1",
    estado: "emitida",
    gastos_generales_porcentaje: 10,
    gastos_generales_total: 100,
    id: "version-1",
    igv_porcentaje: 18,
    igv_total: 180,
    moneda: "PEN",
    nombre: "Proyecto Demo V1",
    numero_version: 1,
    organizacion_id: "org-1",
    presupuesto_borrador_id: "draft-1",
    proyecto_id: "project-1",
    subtotal: 1000,
    subtotal_con_margen: 1000,
    total: 1180,
    ubicacion: "Lima",
    utilidad_porcentaje: 10,
    utilidad_total: 100,
    ...overrides
  };
}

function createDraft(overrides: Partial<PresupuestoBorrador> = {}): PresupuestoBorrador {
  return {
    cliente: "Cliente Demo",
    created_at: "2026-05-19",
    created_by: "user-1",
    estado: "activo",
    gastos_generales_porcentaje: 10,
    gastos_generales_total: 100,
    id: "draft-1",
    igv_porcentaje: 18,
    igv_total: 180,
    moneda: "PEN",
    nombre: "Proyecto Demo",
    organizacion_id: "org-1",
    proyecto_id: "project-1",
    subtotal: 1000,
    subtotal_con_margen: 1000,
    total: 1180,
    ubicacion: "Lima",
    updated_at: "2026-05-20",
    updated_by: "user-1",
    utilidad_porcentaje: 10,
    utilidad_total: 100,
    ...overrides
  };
}

function createResource(overrides: {
  grupo?: "materiales" | "mano_obra" | "equipos_herramientas";
  nombre_snapshot?: string;
  parcial?: number;
  tipo_snapshot?: "material" | "mano_obra" | "equipo" | "herramienta";
  unidad_snapshot?: string;
} = {}) {
  return {
    grupo: "materiales" as const,
    nombre_snapshot: "Cemento",
    parcial: 100,
    tipo_snapshot: "material" as const,
    unidad_snapshot: "bol",
    ...overrides
  };
}

function createSummary(overrides: {
  estado?: BudgetDashboardProject["estado"];
  total?: number;
}) {
  return {
    cliente: "Cliente Demo",
    estado: "aprobado" as const,
    fechaReferencia: "2026-05-20",
    fuente: "official" as const,
    fuenteId: "version-1",
    id: "project-1",
    partidasTotal: 2,
    proyectoNombre: "Proyecto Demo",
    subtotal: 1000,
    total: 1180,
    ubicacion: "Lima",
    versionLabel: "V1 oficial",
    ...overrides
  };
}
