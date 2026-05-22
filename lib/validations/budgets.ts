import { z } from "zod";

import {
  baseEntitySchema,
  coercedNonNegativeNumber,
  coercedPercentage,
  estadoPresupuestoSchema,
  monedaSchema,
  nonNegativeNumber,
  optionalNullableString,
  percentage,
  requiredString
} from "./shared";

export const presupuestoInputSchema = z.object({
  proyecto_nombre: requiredString("El proyecto"),
  cliente: optionalNullableString(),
  ubicacion: optionalNullableString(),
  version: requiredString("La versión"),
  estado: estadoPresupuestoSchema,
  moneda: monedaSchema,
  gastos_generales_porcentaje: percentage("Los gastos generales"),
  utilidad_porcentaje: percentage("La utilidad"),
  igv_porcentaje: percentage("El IGV"),
  subtotal: nonNegativeNumber("El subtotal"),
  gastos_generales_total: nonNegativeNumber("Los gastos generales"),
  utilidad_total: nonNegativeNumber("La utilidad"),
  subtotal_con_margen: nonNegativeNumber("El subtotal con margen"),
  igv_total: nonNegativeNumber("El IGV"),
  total: nonNegativeNumber("El total")
});

export const presupuestoSchema = baseEntitySchema.extend(presupuestoInputSchema.shape);

export const presupuestoPartidaInputSchema = z.object({
  presupuesto_id: requiredString("El presupuesto"),
  partida_id: requiredString("La partida"),
  codigo_snapshot: requiredString("El código"),
  nombre_snapshot: requiredString("El nombre"),
  unidad_snapshot: requiredString("La unidad"),
  categoria_snapshot: optionalNullableString(),
  descripcion_snapshot: optionalNullableString(),
  especificaciones_snapshot: optionalNullableString(),
  rendimiento_snapshot: nonNegativeNumber("El rendimiento").optional().nullable(),
  cuadrilla_snapshot: optionalNullableString(),
  precio_unitario_snapshot: nonNegativeNumber("El precio unitario"),
  metrado: nonNegativeNumber("El metrado"),
  parcial: nonNegativeNumber("El parcial"),
  orden: nonNegativeNumber("El orden")
});

export const presupuestoPartidaSchema = z.object({
  id: requiredString("El ID"),
  ...presupuestoPartidaInputSchema.shape
});

export const budgetDraftUpdateSchema = z.object({
  cliente: optionalNullableString(),
  gastos_generales_porcentaje: coercedPercentage("Los gastos generales").optional(),
  igv_porcentaje: coercedPercentage("El IGV").optional(),
  nombre: requiredString("El nombre").optional(),
  ubicacion: optionalNullableString(),
  utilidad_porcentaje: coercedPercentage("La utilidad").optional()
}).strict();

export const budgetDraftMetradoUpdateSchema = z.object({
  metrado: coercedNonNegativeNumber("El metrado")
});

export const apuPreviewPercentageSchema = z.object({
  porcentaje: coercedPercentage("El porcentaje")
});

export type BudgetDraftUpdateValidation = z.infer<typeof budgetDraftUpdateSchema>;
export type BudgetDraftMetradoUpdateValidation = z.infer<typeof budgetDraftMetradoUpdateSchema>;
export type PresupuestoInput = z.infer<typeof presupuestoInputSchema>;
export type PresupuestoPartidaInput = z.infer<typeof presupuestoPartidaInputSchema>;
export type PresupuestoPartidaValidation = z.infer<typeof presupuestoPartidaSchema>;
export type PresupuestoValidation = z.infer<typeof presupuestoSchema>;
