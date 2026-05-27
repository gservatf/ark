import { z } from "zod";

import { estadoRegistroSchema, optionalNullableString, requiredString } from "./shared";

export const partidaCategoriaInputSchema = z.object({
  nombre: requiredString("La categoria"),
  estado: estadoRegistroSchema.default("activo")
});

export const partidaSubcategoriaInputSchema = z.object({
  categoria_id: requiredString("La categoria"),
  nombre: requiredString("La subcategoria"),
  estado: estadoRegistroSchema.default("activo")
});

export const unidadMedidaInputSchema = z.object({
  codigo: requiredString("El codigo", 40),
  nombre: requiredString("El nombre", 120),
  tipo: optionalNullableString(),
  estado: estadoRegistroSchema.default("activo")
});

export type PartidaCategoriaInput = z.input<typeof partidaCategoriaInputSchema>;
export type PartidaSubcategoriaInput = z.input<typeof partidaSubcategoriaInputSchema>;
export type UnidadMedidaInput = z.input<typeof unidadMedidaInputSchema>;
