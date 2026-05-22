import type {
  Presupuesto,
  PresupuestoPartida,
  PresupuestoPartidaRecursoSnapshot
} from "@/types/domain";
import {
  calculateApuDirectCost,
  calculateApuResourcePartial
} from "@/lib/calculations/apu";
import { calculateBudgetLinePartial, calculateBudgetTotals } from "@/lib/calculations/budget";
import { mockPartidaResources, mockPartidas } from "@/lib/mock-data/partidas";
import { mockProviders } from "@/lib/mock-data/providers";
import { mockResources } from "@/lib/mock-data/resources";

export type BudgetExecutionSnapshot = {
  presupuestoId: string;
  completedLineIds: string[];
};

export type BudgetDashboardProject = {
  id: string;
  proyecto_nombre: string;
  cliente: string | null;
  ubicacion: string | null;
  estado: Presupuesto["estado"];
  version: string;
  total: number;
  subtotal: number;
  partidasTotal: number;
  partidasCompletadas: number;
  avancePorcentaje: number;
  gastoEjecutado: number;
  gastoPorcentaje: number;
  updated_at: string;
};

export const mockBudgets: Presupuesto[] = [
  createBudget({
    id: "pres-los-olivos-v3",
    proyecto_nombre: "Edificio Multifamiliar Los Olivos",
    cliente: "Inmobiliaria Los Olivos SAC",
    ubicacion: "Lima, Perú",
    version: "Versión 3",
    estado: "borrador",
    created_at: "2026-05-01",
    updated_at: "2026-05-13",
    lines: [
      createBudgetLine({
        id: "line-los-olivos-tarrajeo",
        presupuestoId: "pres-los-olivos-v3",
        partidaId: "part-tarrajeo-muros",
        metrado: 350,
        orden: 1
      }),
      createBudgetLine({
        id: "line-los-olivos-concreto",
        presupuestoId: "pres-los-olivos-v3",
        partidaId: "part-concreto-210",
        metrado: 42,
        orden: 2
      }),
      createBudgetLine({
        id: "line-los-olivos-porcelanato",
        presupuestoId: "pres-los-olivos-v3",
        partidaId: "part-piso-porcelanato",
        metrado: 120,
        orden: 3
      })
    ]
  }),
  createBudget({
    id: "pres-miraflores-v1",
    proyecto_nombre: "Remodelación Oficinas Miraflores",
    cliente: "Grupo Andino",
    ubicacion: "Miraflores, Lima",
    version: "Versión 1",
    estado: "borrador",
    created_at: "2026-05-08",
    updated_at: "2026-05-12",
    lines: [
      createBudgetLine({
        id: "line-miraflores-tarrajeo",
        presupuestoId: "pres-miraflores-v1",
        partidaId: "part-tarrajeo-muros",
        metrado: 180,
        orden: 1
      })
    ]
  })
];

export const mockBudgetExecutionSnapshots: BudgetExecutionSnapshot[] = [
  {
    presupuestoId: "pres-los-olivos-v3",
    completedLineIds: ["line-los-olivos-tarrajeo", "line-los-olivos-concreto"]
  },
  {
    presupuestoId: "pres-miraflores-v1",
    completedLineIds: []
  }
];

const linesByBudgetId = new Map<string, PresupuestoPartida[]>();
const resourceSnapshotsByBudgetId = new Map<string, PresupuestoPartidaRecursoSnapshot[]>();

mockBudgets.forEach((budget) => {
  linesByBudgetId.set(budget.id, []);
  resourceSnapshotsByBudgetId.set(budget.id, []);
});

seedBudgetLines("pres-los-olivos-v3", [
  createBudgetLine({
    id: "line-los-olivos-tarrajeo",
    presupuestoId: "pres-los-olivos-v3",
    partidaId: "part-tarrajeo-muros",
    metrado: 350,
    orden: 1
  }),
  createBudgetLine({
    id: "line-los-olivos-concreto",
    presupuestoId: "pres-los-olivos-v3",
    partidaId: "part-concreto-210",
    metrado: 42,
    orden: 2
  }),
  createBudgetLine({
    id: "line-los-olivos-porcelanato",
    presupuestoId: "pres-los-olivos-v3",
    partidaId: "part-piso-porcelanato",
    metrado: 120,
    orden: 3
  })
]);

seedBudgetLines("pres-miraflores-v1", [
  createBudgetLine({
    id: "line-miraflores-tarrajeo",
    presupuestoId: "pres-miraflores-v1",
    partidaId: "part-tarrajeo-muros",
    metrado: 180,
    orden: 1
  })
]);

export const mockBudgetLines: PresupuestoPartida[] = Array.from(linesByBudgetId.values()).flat();
export const mockBudgetLineResourceSnapshots: PresupuestoPartidaRecursoSnapshot[] = Array.from(
  resourceSnapshotsByBudgetId.values()
).flat();

export function getInitialBudgetLines(presupuestoId: string) {
  return linesByBudgetId.get(presupuestoId) || [];
}

export function getInitialBudgetLineResourceSnapshots(presupuestoId: string) {
  return resourceSnapshotsByBudgetId.get(presupuestoId) || [];
}

export function getBudgetDashboardProjects(): BudgetDashboardProject[] {
  return mockBudgets.map((budget) => {
    const lines = getInitialBudgetLines(budget.id);
    const execution = mockBudgetExecutionSnapshots.find(
      (snapshot) => snapshot.presupuestoId === budget.id
    );
    const completedLineIds = new Set(execution?.completedLineIds || []);
    const completedLines = lines.filter((line) => completedLineIds.has(line.id));
    const partidasTotal = lines.length;
    const partidasCompletadas = completedLines.length;
    const avancePorcentaje =
      partidasTotal > 0 ? Math.round((partidasCompletadas / partidasTotal) * 100) : 0;
    const gastoEjecutado = completedLines.reduce((total, line) => total + line.parcial, 0);
    const gastoPorcentaje = budget.total > 0 ? Math.round((gastoEjecutado / budget.total) * 100) : 0;

    return {
      id: budget.id,
      proyecto_nombre: budget.proyecto_nombre,
      cliente: budget.cliente || null,
      ubicacion: budget.ubicacion || null,
      estado: budget.estado,
      version: budget.version,
      total: budget.total,
      subtotal: budget.subtotal,
      partidasTotal,
      partidasCompletadas,
      avancePorcentaje,
      gastoEjecutado,
      gastoPorcentaje,
      updated_at: budget.updated_at
    };
  });
}

export function createBudgetLine({
  id = `line-${Date.now()}`,
  metrado,
  orden,
  partidaId,
  presupuestoId
}: {
  id?: string;
  metrado: number;
  orden: number;
  partidaId: string;
  presupuestoId: string;
}): PresupuestoPartida {
  const partida = mockPartidas.find((item) => item.id === partidaId);

  if (!partida) {
    throw new Error(`No existe la partida mock ${partidaId}.`);
  }

  const resources = mockPartidaResources.filter((resource) => resource.partida_id === partida.id);
  const directTotals = calculateApuDirectCost(resources);
  const line = {
    id,
    presupuesto_id: presupuestoId,
    partida_id: partida.id,
    codigo_snapshot: partida.codigo,
    nombre_snapshot: partida.nombre,
    unidad_snapshot: partida.unidad,
    categoria_snapshot: partida.categoria,
    descripcion_snapshot: partida.descripcion,
    especificaciones_snapshot: partida.especificaciones,
    rendimiento_snapshot: partida.rendimiento,
    cuadrilla_snapshot: partida.cuadrilla,
    precio_unitario_snapshot: directTotals.costo_directo,
    metrado,
    parcial: 0,
    orden
  };

  return {
    ...line,
    parcial: calculateBudgetLinePartial(line)
  };
}

export function createBudgetLineResourceSnapshots(
  line: PresupuestoPartida
): PresupuestoPartidaRecursoSnapshot[] {
  return mockPartidaResources
    .filter((partidaResource) => partidaResource.partida_id === line.partida_id)
    .map((partidaResource) => {
      const resource = mockResources.find((item) => item.id === partidaResource.recurso_id);
      const provider = resource?.proveedor_id
        ? mockProviders.find((item) => item.id === resource.proveedor_id)
        : undefined;

      if (!resource) {
        throw new Error(`No existe el recurso mock ${partidaResource.recurso_id}.`);
      }

      return {
        id: `snap-${line.id}-${partidaResource.id}`,
        presupuesto_id: line.presupuesto_id,
        presupuesto_partida_id: line.id,
        partida_recurso_id: partidaResource.id,
        recurso_id: resource.id,
        nombre_snapshot: resource.nombre,
        tipo_snapshot: resource.tipo,
        unidad_snapshot: resource.unidad,
        costo_unitario_snapshot: partidaResource.costo_unitario_snapshot,
        costo_transporte_snapshot: partidaResource.costo_transporte_snapshot,
        proveedor_id_snapshot: resource.proveedor_id,
        proveedor_nombre_snapshot: provider?.nombre || null,
        fuente_precio_snapshot: resource.fuente_precio,
        fecha_precio_snapshot: resource.fecha_actualizacion_precio,
        grupo: partidaResource.grupo,
        cantidad: partidaResource.cantidad,
        unidad: partidaResource.unidad,
        rendimiento_factor: partidaResource.rendimiento_factor,
        desperdicio_porcentaje: partidaResource.desperdicio_porcentaje,
        parcial_snapshot: calculateApuResourcePartial(partidaResource),
        orden: partidaResource.orden
      };
    });
}

export function recalculateBudgetTotals(
  budget: Presupuesto,
  lines: PresupuestoPartida[]
): Presupuesto {
  const totals = calculateBudgetTotals({
    lines,
    gastos_generales_porcentaje: budget.gastos_generales_porcentaje,
    utilidad_porcentaje: budget.utilidad_porcentaje,
    igv_porcentaje: budget.igv_porcentaje
  });

  return {
    ...budget,
    ...totals,
    updated_at: new Date().toISOString().slice(0, 10)
  };
}

function createBudget({
  cliente,
  created_at,
  estado,
  id,
  lines,
  proyecto_nombre,
  ubicacion,
  updated_at,
  version
}: {
  cliente: string;
  created_at: string;
  estado: Presupuesto["estado"];
  id: string;
  lines: PresupuestoPartida[];
  proyecto_nombre: string;
  ubicacion: string;
  updated_at: string;
  version: string;
}): Presupuesto {
  const base: Presupuesto = {
    id,
    proyecto_nombre,
    cliente,
    ubicacion,
    version,
    estado,
    moneda: "PEN",
    gastos_generales_porcentaje: 10,
    utilidad_porcentaje: 10,
    igv_porcentaje: 18,
    subtotal: 0,
    gastos_generales_total: 0,
    utilidad_total: 0,
    subtotal_con_margen: 0,
    igv_total: 0,
    total: 0,
    created_at,
    updated_at
  };

  return {
    ...recalculateBudgetTotals(base, lines),
    updated_at
  };
}

function seedBudgetLines(presupuestoId: string, lines: PresupuestoPartida[]) {
  linesByBudgetId.set(presupuestoId, lines);
  resourceSnapshotsByBudgetId.set(
    presupuestoId,
    lines.flatMap((line) => createBudgetLineResourceSnapshots(line))
  );
}
