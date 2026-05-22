import type { GrupoApu, PartidaRecurso } from "@/types/domain";
import { roundMoney } from "./money";

export interface ApuResourceCalculationInput {
  cantidad: number;
  costo_unitario_snapshot: number;
  costo_transporte_snapshot: number;
  desperdicio_porcentaje?: number | null;
  rendimiento_factor?: number | null;
}

export interface ApuDirectCostInput extends ApuResourceCalculationInput {
  grupo: GrupoApu;
}

export interface ApuDirectCostTotals {
  costo_materiales: number;
  costo_mano_obra: number;
  costo_equipos_herramientas: number;
  costo_directo: number;
}

export interface ApuUnitPriceInput {
  costo_directo: number;
  gastos_generales_porcentaje: number;
  utilidad_porcentaje: number;
}

export interface ApuUnitPriceTotals {
  costo_directo: number;
  gastos_generales: number;
  utilidad: number;
  precio_unitario: number;
}

export function calculateApuResourcePartial(resource: ApuResourceCalculationInput): number {
  const cantidad = assertNonNegative(resource.cantidad, "cantidad");
  const costoUnitario = assertNonNegative(
    resource.costo_unitario_snapshot,
    "costo_unitario_snapshot"
  );
  const costoTransporte = assertNonNegative(
    resource.costo_transporte_snapshot,
    "costo_transporte_snapshot"
  );
  const desperdicioPorcentaje = assertPercentage(
    resource.desperdicio_porcentaje ?? 0,
    "desperdicio_porcentaje"
  );
  if (resource.rendimiento_factor !== null && resource.rendimiento_factor !== undefined) {
    assertNonNegative(resource.rendimiento_factor, "rendimiento_factor");
  }

  const base = cantidad * costoUnitario;
  const transporte = cantidad * costoTransporte;
  const desperdicio = (base * desperdicioPorcentaje) / 100;

  return roundMoney(base + transporte + desperdicio);
}

export function calculateApuDirectCost(
  resources: Array<ApuDirectCostInput | PartidaRecurso>
): ApuDirectCostTotals {
  const totals = resources.reduce(
    (accumulator, resource) => {
      const partial = calculateApuResourcePartial(resource);

      if (resource.grupo === "materiales") {
        accumulator.costo_materiales += partial;
      }

      if (resource.grupo === "mano_obra") {
        accumulator.costo_mano_obra += partial;
      }

      if (resource.grupo === "equipos_herramientas") {
        accumulator.costo_equipos_herramientas += partial;
      }

      return accumulator;
    },
    {
      costo_materiales: 0,
      costo_mano_obra: 0,
      costo_equipos_herramientas: 0
    }
  );

  const costoMateriales = roundMoney(totals.costo_materiales);
  const costoManoObra = roundMoney(totals.costo_mano_obra);
  const costoEquiposHerramientas = roundMoney(totals.costo_equipos_herramientas);

  return {
    costo_materiales: costoMateriales,
    costo_mano_obra: costoManoObra,
    costo_equipos_herramientas: costoEquiposHerramientas,
    costo_directo: roundMoney(costoMateriales + costoManoObra + costoEquiposHerramientas)
  };
}

export function calculateApuUnitPrice(input: ApuUnitPriceInput): ApuUnitPriceTotals {
  const costoDirecto = assertNonNegative(input.costo_directo, "costo_directo");
  const gastosGeneralesPorcentaje = assertPercentage(
    input.gastos_generales_porcentaje,
    "gastos_generales_porcentaje"
  );
  const utilidadPorcentaje = assertPercentage(input.utilidad_porcentaje, "utilidad_porcentaje");

  const gastosGenerales = (costoDirecto * gastosGeneralesPorcentaje) / 100;
  const utilidad = (costoDirecto * utilidadPorcentaje) / 100;
  const precioUnitario = costoDirecto + gastosGenerales + utilidad;

  return {
    costo_directo: roundMoney(costoDirecto),
    gastos_generales: roundMoney(gastosGenerales),
    utilidad: roundMoney(utilidad),
    precio_unitario: roundMoney(precioUnitario)
  };
}

function assertPercentage(value: number, fieldName: string): number {
  const validValue = assertNonNegative(value, fieldName);

  if (validValue > 100) {
    throw new RangeError(`${fieldName} debe estar entre 0 y 100.`);
  }

  return validValue;
}

function assertNonNegative(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${fieldName} debe ser un número no negativo.`);
  }

  return value;
}
