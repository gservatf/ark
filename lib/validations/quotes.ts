import { z } from "zod";

import {
  baseEntitySchema,
  coercedNonNegativeNumber,
  estadoRegistroSchema,
  monedaSchema,
  optionalNullableString,
  requiredString
} from "./shared";

const recursoProveedorPrecioShape = {
  recurso_id: requiredString("El recurso"),
  proveedor_id: requiredString("El proveedor"),
  costo_unitario: coercedNonNegativeNumber("El costo unitario"),
  costo_transporte: coercedNonNegativeNumber("El costo de transporte"),
  moneda: monedaSchema,
  fecha_cotizacion: optionalNullableString(),
  vigente_desde: optionalNullableString(),
  vigente_hasta: optionalNullableString(),
  fuente_precio: optionalNullableString(),
  url_referencia: optionalNullableString(),
  es_preferido_interno: z.boolean(),
  estado: estadoRegistroSchema
};

const recursoProveedorPrecioBaseSchema = z.object({
  ...recursoProveedorPrecioShape,
  moneda: monedaSchema.default("PEN"),
  es_preferido_interno: z.boolean().default(false),
  estado: estadoRegistroSchema.default("activo")
});

function hasValidQuoteRange(value: { vigente_desde?: string | null; vigente_hasta?: string | null }) {
  return (
    !value.vigente_desde ||
    !value.vigente_hasta ||
    value.vigente_hasta >= value.vigente_desde
  );
}

export const recursoProveedorPrecioInputSchema = recursoProveedorPrecioBaseSchema
  .refine(
    hasValidQuoteRange,
    {
      message: "La fecha fin de vigencia no puede ser anterior al inicio.",
      path: ["vigente_hasta"]
    }
  );

export const recursoProveedorPrecioUpdateSchema = z.object(recursoProveedorPrecioShape)
  .partial()
  .refine(hasValidQuoteRange, {
    message: "La fecha fin de vigencia no puede ser anterior al inicio.",
    path: ["vigente_hasta"]
  });

export const recursoProveedorPrecioSchema = baseEntitySchema.extend({
  organizacion_id: requiredString("La organización"),
  ...recursoProveedorPrecioInputSchema.shape
});

export const precioClienteOverrideSchema = z.object({
  precio_cliente_actual: coercedNonNegativeNumber("El precio cliente"),
  motivo_precio_cliente_override: optionalNullableString()
});

export type PrecioClienteOverrideInput = z.infer<typeof precioClienteOverrideSchema>;
export type RecursoProveedorPrecioInput = z.infer<typeof recursoProveedorPrecioInputSchema>;
export type RecursoProveedorPrecioUpdateInput = z.infer<typeof recursoProveedorPrecioUpdateSchema>;
export type RecursoProveedorPrecioValidation = z.infer<typeof recursoProveedorPrecioSchema>;
