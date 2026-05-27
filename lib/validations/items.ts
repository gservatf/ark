import { z } from "zod";

import {
  baseEntitySchema,
  coercedNonNegativeNumber,
  coercedPercentage,
  coercedPositiveNumber,
  estadoRegistroSchema,
  grupoApuSchema,
  optionalNullableString,
  requiredString,
  tipoCalculoApuSchema
} from "./shared";

const optionalCodeSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().max(255, "El codigo no puede tener mas de 255 caracteres.").optional().nullable()
);

const optionalIdSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().uuid("El ID seleccionado no es valido.").optional().nullable()
);

const positiveWithDefault = (label: string, defaultValue: number) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? defaultValue : value),
    coercedPositiveNumber(label).transform((number) => number ?? defaultValue)
  );

const percentageWithDefault = (label: string, defaultValue: number) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? defaultValue : value),
    coercedPercentage(label)
  );

export const partidaInputSchema = z.object({
  codigo: optionalCodeSchema,
  nombre: requiredString("El nombre"),
  unidad: requiredString("La unidad"),
  unidad_id: optionalIdSchema,
  categoria: requiredString("La categoria"),
  categoria_id: optionalIdSchema,
  subcategoria: optionalNullableString(),
  subcategoria_id: optionalIdSchema,
  especificaciones: optionalNullableString(),
  rendimiento: positiveWithDefault("El rendimiento", 1),
  jornada_horas: positiveWithDefault("La jornada", 8),
  desperdicio_materiales_porcentaje: percentageWithDefault("El desperdicio de materiales", 5),
  estado: estadoRegistroSchema.default("activo")
});

export const partidaSchema = baseEntitySchema.extend(partidaInputSchema.shape);

export const partidaRecursoInputSchema = z.object({
  partida_id: requiredString("La partida"),
  recurso_id: requiredString("El recurso"),
  grupo: grupoApuSchema,
  tipo_calculo_apu: tipoCalculoApuSchema,
  cuadrilla: coercedNonNegativeNumber("La cuadrilla").optional().nullable(),
  cantidad_base: coercedNonNegativeNumber("La cantidad").optional().nullable(),
  porcentaje_aplicado: coercedPercentage("El porcentaje").optional().nullable(),
  cantidad: coercedNonNegativeNumber("La cantidad"),
  unidad: requiredString("La unidad"),
  costo_unitario_snapshot: coercedNonNegativeNumber("El costo unitario"),
  costo_transporte_snapshot: coercedNonNegativeNumber("El costo de transporte"),
  parcial: coercedNonNegativeNumber("El parcial"),
  orden: coercedNonNegativeNumber("El orden")
});

export const partidaApuResourceFormSchema = z
  .object({
    partida_id: requiredString("La partida"),
    recurso_id: requiredString("El recurso"),
    grupo: grupoApuSchema,
    tipo_calculo_apu: tipoCalculoApuSchema,
    cuadrilla: coercedNonNegativeNumber("La cuadrilla").optional().nullable(),
    cantidad_base: coercedNonNegativeNumber("La cantidad").optional().nullable(),
    porcentaje_aplicado: coercedPercentage("El porcentaje").optional().nullable(),
    orden: coercedNonNegativeNumber("El orden").optional()
  })
  .superRefine((input, context) => {
    if (
      (input.tipo_calculo_apu === "mano_obra_rendimiento" ||
        input.tipo_calculo_apu === "equipo_hm_rendimiento") &&
      (input.cuadrilla === null || input.cuadrilla === undefined)
    ) {
      context.addIssue({
        code: "custom",
        message: "La cuadrilla es obligatoria para este recurso.",
        path: ["cuadrilla"]
      });
    }

    if (
      (input.tipo_calculo_apu === "material_desperdicio" ||
        input.tipo_calculo_apu === "equipo_cantidad_fija") &&
      (input.cantidad_base === null || input.cantidad_base === undefined)
    ) {
      context.addIssue({
        code: "custom",
        message: "La cantidad es obligatoria para este recurso.",
        path: ["cantidad_base"]
      });
    }
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
