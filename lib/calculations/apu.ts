import type { GrupoApu, PartidaRecurso, TipoCalculoApu } from "@/types/domain";
import { roundMoney } from "./money";

export interface ApuResourceCalculationInput {
  cantidad: number;
  costo_unitario_snapshot: number;
  costo_transporte_snapshot: number;
  tipo_calculo_apu?: TipoCalculoApu | null;
  cuadrilla?: number | null;
  cantidad_base?: number | null;
  porcentaje_aplicado?: number | null;
  parcial?: number | null;
}

export interface ApuDirectCostInput extends ApuResourceCalculationInput {
  grupo: GrupoApu;
}

export interface ApuPartidaCalculationContext {
  rendimiento?: number | null;
  jornada_horas?: number | null;
  desperdicio_materiales_porcentaje?: number | null;
}

export interface ApuResourceComputedValues {
  cantidad: number;
  parcial: number;
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
  if (resource.tipo_calculo_apu === "herramientas_porcentaje_mano_obra") {
    if (typeof resource.parcial === "number") {
      return roundMoney(resource.parcial);
    }

    return 0;
  }

  const cantidad = assertNonNegative(resource.cantidad, "cantidad");
  const costoUnitario = assertNonNegative(
    resource.costo_unitario_snapshot,
    "costo_unitario_snapshot"
  );
  const costoTransporte = assertNonNegative(
    resource.costo_transporte_snapshot,
    "costo_transporte_snapshot"
  );
  const base = cantidad * costoUnitario;
  const transporte = cantidad * costoTransporte;

  return roundMoney(base + transporte);
}

export function calculateApuResourceValues(
  resource: ApuResourceCalculationInput,
  context: ApuPartidaCalculationContext = {},
  subtotalManoObra = 0
): ApuResourceComputedValues {
  const tipoCalculo = resource.tipo_calculo_apu || inferLegacyCalculationType(resource);
  const costoUnitario = assertNonNegative(
    resource.costo_unitario_snapshot,
    "costo_unitario_snapshot"
  );
  const costoTransporte = assertNonNegative(
    resource.costo_transporte_snapshot,
    "costo_transporte_snapshot"
  );
  const rendimiento = assertPositive(context.rendimiento ?? 1, "rendimiento");
  const jornadaHoras = assertPositive(context.jornada_horas ?? 8, "jornada_horas");
  const desperdicioMateriales = assertPercentage(
    context.desperdicio_materiales_porcentaje ?? 0,
    "desperdicio_materiales_porcentaje"
  );

  if (tipoCalculo === "mano_obra_rendimiento" || tipoCalculo === "equipo_hm_rendimiento") {
    const cuadrilla = assertNonNegative(resource.cuadrilla ?? resource.cantidad_base ?? resource.cantidad, "cuadrilla");
    const cantidad = roundQuantity((cuadrilla * jornadaHoras) / rendimiento);

    return {
      cantidad,
      parcial: roundMoney(cantidad * (costoUnitario + costoTransporte))
    };
  }

  if (tipoCalculo === "material_desperdicio") {
    const cantidadBase = assertNonNegative(resource.cantidad_base ?? resource.cantidad, "cantidad_base");
    const cantidad = roundQuantity(cantidadBase * (1 + desperdicioMateriales / 100));

    return {
      cantidad,
      parcial: roundMoney(cantidad * (costoUnitario + costoTransporte))
    };
  }

  if (tipoCalculo === "herramientas_porcentaje_mano_obra") {
    const porcentaje = assertPercentage(resource.porcentaje_aplicado ?? 3, "porcentaje_aplicado");

    return {
      cantidad: roundQuantity(porcentaje),
      parcial: roundMoney((subtotalManoObra * porcentaje) / 100)
    };
  }

  const cantidad = assertNonNegative(resource.cantidad_base ?? resource.cantidad, "cantidad_base");

  return {
    cantidad: roundQuantity(cantidad),
    parcial: roundMoney(cantidad * (costoUnitario + costoTransporte))
  };
}

export function calculateApuDirectCost(
  resources: Array<ApuDirectCostInput | PartidaRecurso>,
  context: ApuPartidaCalculationContext = {}
): ApuDirectCostTotals {
  const manoObraSubtotal = resources.reduce((total, resource) => {
    if (resource.grupo !== "mano_obra") {
      return total;
    }

    return total + calculateApuResourceValues(resource, context).parcial;
  }, 0);

  const totals = resources.reduce(
    (accumulator, resource) => {
      const partial =
        resource.tipo_calculo_apu === "herramientas_porcentaje_mano_obra"
          ? calculateApuResourceValues(resource, context, manoObraSubtotal).parcial
          : calculateApuResourceValues(resource, context).parcial;

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

export function inferApuCalculationTypeFromResource({
  grupo,
  unidad
}: {
  grupo: GrupoApu;
  unidad: string;
}): TipoCalculoApu {
  if (grupo === "mano_obra") {
    return "mano_obra_rendimiento";
  }

  if (grupo === "materiales") {
    return "material_desperdicio";
  }

  if (unidad.trim().toUpperCase() === "%") {
    return "herramientas_porcentaje_mano_obra";
  }

  if (unidad.trim().toUpperCase() === "HM") {
    return "equipo_hm_rendimiento";
  }

  return "equipo_cantidad_fija";
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

function assertPositive(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${fieldName} debe ser mayor que 0.`);
  }

  return value;
}

function assertNonNegative(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${fieldName} debe ser un número no negativo.`);
  }

  return value;
}

function roundQuantity(value: number) {
  return Math.round(value * 1000000) / 1000000;
}

function inferLegacyCalculationType(resource: ApuResourceCalculationInput): TipoCalculoApu {
  return "equipo_cantidad_fija";
}
