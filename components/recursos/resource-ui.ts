import type { EstadoRegistro, TipoRecurso } from "@/types/domain";
import { formatDisplayDate } from "@/lib/format/date";

export const resourceTypeLabels: Record<TipoRecurso, string> = {
  material: "Material",
  mano_obra: "Mano de obra",
  equipo: "Equipo",
  herramienta: "Herramienta"
};

export const resourceStatusLabels: Record<EstadoRegistro, string> = {
  activo: "Activo",
  inactivo: "Inactivo"
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    currency: "PEN",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency"
  }).format(value);
}

export function formatDate(value?: string | null) {
  return formatDisplayDate(value);
}
