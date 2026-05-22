import { z } from "zod";

export const estadoRegistroSchema = z.enum(["activo", "inactivo"]);
export const estadoPresupuestoSchema = z.enum(["borrador", "aprobado", "archivado"]);
export const grupoApuSchema = z.enum(["materiales", "mano_obra", "equipos_herramientas"]);
export const monedaSchema = z.enum(["PEN"]);
export const tipoRecursoSchema = z.enum(["material", "mano_obra", "equipo", "herramienta"]);

export const isoDateStringSchema = z.string().trim().min(1, "La fecha es obligatoria.");

export const baseEntitySchema = z.object({
  id: requiredString("El ID"),
  created_at: isoDateStringSchema,
  updated_at: isoDateStringSchema
});

function requiredSuffix(label: string) {
  if (label.startsWith("La ")) {
    return "obligatoria";
  }

  if (label.startsWith("Las ")) {
    return "obligatorias";
  }

  if (label.startsWith("Los ")) {
    return "obligatorios";
  }

  return "obligatorio";
}

export function requiredString(label: string, maxLength = 255) {
  return z
    .string()
    .trim()
    .min(1, `${label} es ${requiredSuffix(label)}.`)
    .max(maxLength, `${label} no puede tener más de ${maxLength} caracteres.`);
}

export function optionalNullableString() {
  return z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().optional().nullable()
  );
}

export const optionalRucSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z
    .string()
    .trim()
    .regex(/^\d{11}$/, "El RUC debe tener 11 dígitos.")
    .optional()
    .nullable()
);

function coerceStringNumber(value: unknown, emptyValue: unknown = Number.NaN) {
  if (typeof value === "string") {
    const trimmed = value.trim();

    return trimmed === "" ? emptyValue : Number(trimmed);
  }

  return value;
}

export function nonNegativeNumber(label: string) {
  return z
    .number({ message: `${label} debe ser un número.` })
    .finite(`${label} debe ser un número válido.`)
    .nonnegative(`${label} no puede ser negativo.`);
}

export function coercedNonNegativeNumber(label: string) {
  return z.preprocess((value) => coerceStringNumber(value), nonNegativeNumber(label));
}

export function coercedPositiveNumber(label: string) {
  return z.preprocess(
    (value) => coerceStringNumber(value, null),
    z
      .number({ message: `${label} debe ser un número.` })
      .finite(`${label} debe ser un número válido.`)
      .positive(`${label} debe ser mayor que 0.`)
      .optional()
      .nullable()
  );
}

export function percentage(label: string) {
  return nonNegativeNumber(label).max(100, `${label} debe estar entre 0 y 100.`);
}

export function coercedPercentage(label: string) {
  return z.preprocess((value) => coerceStringNumber(value), percentage(label));
}
