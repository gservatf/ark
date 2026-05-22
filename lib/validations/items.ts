import { z } from "zod";

import {
  baseEntitySchema,
  coercedNonNegativeNumber,
  coercedPercentage,
  coercedPositiveNumber,
  estadoRegistroSchema,
  grupoApuSchema,
  optionalNullableString,
  requiredString
} from "./shared";

export const partidaInputSchema = z.object({
  codigo: requiredString("El código"),
  nombre: requiredString("El nombre"),
  unidad: requiredString("La unidad"),
  categoria: optionalNullableString(),
  descripcion: optionalNullableString(),
  especificaciones: optionalNullableString(),
  rendimiento: coercedPositiveNumber("El rendimiento"),
  cuadrilla: optionalNullableString(),
  estado: estadoRegistroSchema
});

export const partidaSchema = baseEntitySchema.extend(partidaInputSchema.shape);

export const partidaRecursoInputSchema = z.object({
  partida_id: requiredString("La partida"),
  recurso_id: requiredString("El recurso"),
  grupo: grupoApuSchema,
  cantidad: coercedNonNegativeNumber("La cantidad"),
  unidad: requiredString("La unidad"),
  costo_unitario_snapshot: coercedNonNegativeNumber("El costo unitario"),
  costo_transporte_snapshot: coercedNonNegativeNumber("El costo de transporte"),
  rendimiento_factor: coercedPositiveNumber("El factor de rendimiento"),
  desperdicio_porcentaje: coercedPercentage("El desperdicio"),
  parcial: coercedNonNegativeNumber("El parcial"),
  orden: coercedNonNegativeNumber("El orden")
});

export const partidaApuResourceFormSchema = z.object({
  partida_id: requiredString("La partida"),
  recurso_id: requiredString("El recurso"),
  grupo: grupoApuSchema,
  cantidad: coercedNonNegativeNumber("La cantidad"),
  rendimiento_factor: coercedPositiveNumber("El factor de rendimiento"),
  desperdicio_porcentaje: coercedPercentage("El desperdicio"),
  orden: coercedNonNegativeNumber("El orden").optional()
});

export const partidaRecursoSchema = z.object({
  id: requiredString("El ID"),
  ...partidaRecursoInputSchema.shape
});

export type PartidaInput = z.infer<typeof partidaInputSchema>;
export type PartidaApuResourceFormInput = z.infer<typeof partidaApuResourceFormSchema>;
export type PartidaRecursoInput = z.infer<typeof partidaRecursoInputSchema>;
export type PartidaRecursoValidation = z.infer<typeof partidaRecursoSchema>;
export type PartidaValidation = z.infer<typeof partidaSchema>;
