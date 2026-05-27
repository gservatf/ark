import { z } from "zod";

import {
  baseEntitySchema,
  coercedNonNegativeNumber,
  estadoRegistroSchema,
  optionalNullableId,
  optionalNullableString,
  requiredString,
  tipoRecursoSchema
} from "./shared";

export const recursoInputSchema = z.object({
  nombre: requiredString("El nombre"),
  tipo: tipoRecursoSchema,
  unidad: requiredString("La unidad"),
  unidad_id: optionalNullableId(),
  costo_unitario_actual: coercedNonNegativeNumber("El costo unitario"),
  proveedor_id: optionalNullableString(),
  transporte_aplica: z.boolean(),
  costo_transporte: coercedNonNegativeNumber("El costo de transporte"),
  especificacion: optionalNullableString(),
  marca: optionalNullableString(),
  fuente_precio: optionalNullableString(),
  fecha_actualizacion_precio: optionalNullableString(),
  estado: estadoRegistroSchema
});

export const recursoSchema = baseEntitySchema.extend(recursoInputSchema.shape);

export type RecursoInput = z.infer<typeof recursoInputSchema>;
export type RecursoValidation = z.infer<typeof recursoSchema>;
