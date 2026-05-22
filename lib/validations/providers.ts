import { z } from "zod";

import {
  baseEntitySchema,
  estadoRegistroSchema,
  optionalNullableString,
  optionalRucSchema,
  requiredString
} from "./shared";

const optionalEmailSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().email("El email debe tener un formato válido.").optional().nullable()
);

export const proveedorInputSchema = z.object({
  nombre: requiredString("El nombre"),
  ruc: optionalRucSchema,
  contacto: optionalNullableString(),
  telefono: optionalNullableString(),
  email: optionalEmailSchema,
  direccion: optionalNullableString(),
  notas: optionalNullableString(),
  disponible_para_cliente: z.boolean().optional().default(false)
});

export const proveedorSchema = baseEntitySchema.extend({
  ...proveedorInputSchema.shape,
  estado: estadoRegistroSchema
});

export type ProveedorInput = z.input<typeof proveedorInputSchema>;
export type ProveedorValidation = z.infer<typeof proveedorSchema>;
