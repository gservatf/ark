import type { PresupuestoPartida } from "@/types/domain";
import { roundMoney } from "./money";

export interface BudgetLineCalculationInput {
  metrado: number;
  precio_unitario_snapshot: number;
}

export interface BudgetTotalsInput {
  lines: Array<BudgetLineCalculationInput | PresupuestoPartida>;
  gastos_generales_porcentaje: number;
  utilidad_porcentaje: number;
  igv_porcentaje: number;
}

export interface BudgetTotals {
  subtotal: number;
  gastos_generales_total: number;
  utilidad_total: number;
  subtotal_con_margen: number;
  igv_total: number;
  total: number;
}

export function calculateBudgetLinePartial(line: BudgetLineCalculationInput): number {
  const metrado = assertNonNegative(line.metrado, "metrado");
  const precioUnitario = assertNonNegative(
    line.precio_unitario_snapshot,
    "precio_unitario_snapshot"
  );

  return roundMoney(metrado * precioUnitario);
}

export function calculateBudgetTotals(input: BudgetTotalsInput): BudgetTotals {
  const gastosGeneralesPorcentaje = assertPercentage(
    input.gastos_generales_porcentaje,
    "gastos_generales_porcentaje"
  );
  const utilidadPorcentaje = assertPercentage(input.utilidad_porcentaje, "utilidad_porcentaje");
  const igvPorcentaje = assertPercentage(input.igv_porcentaje, "igv_porcentaje");

  const subtotal = input.lines.reduce(
    (total, line) => total + calculateBudgetLinePartial(line),
    0
  );
  const gastosGeneralesTotal = (subtotal * gastosGeneralesPorcentaje) / 100;
  const utilidadTotal = (subtotal * utilidadPorcentaje) / 100;
  const subtotalConMargen = subtotal + gastosGeneralesTotal + utilidadTotal;
  const igvTotal = (subtotalConMargen * igvPorcentaje) / 100;

  return {
    subtotal: roundMoney(subtotal),
    gastos_generales_total: roundMoney(gastosGeneralesTotal),
    utilidad_total: roundMoney(utilidadTotal),
    subtotal_con_margen: roundMoney(subtotalConMargen),
    igv_total: roundMoney(igvTotal),
    total: roundMoney(subtotalConMargen + igvTotal)
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
