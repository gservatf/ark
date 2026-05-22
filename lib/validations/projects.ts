import { z } from "zod";

import { optionalNullableString, requiredString } from "./shared";

export const projectInputSchema = z.object({
  cliente: optionalNullableString(),
  nombre: requiredString("El nombre del proyecto"),
  ubicacion: optionalNullableString()
});

export type ProjectInput = z.input<typeof projectInputSchema>;
export type ProjectValidation = z.infer<typeof projectInputSchema>;
