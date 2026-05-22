import type { EstadoPartida, GrupoApu } from "@/types/domain";

export const partidaStatusLabels: Record<EstadoPartida, string> = {
  activo: "Activo",
  inactivo: "Inactivo"
};

export const grupoApuLabels: Record<GrupoApu, string> = {
  materiales: "Materiales",
  mano_obra: "Mano de obra",
  equipos_herramientas: "Equipos / herramientas"
};

export const grupoApuColors: Record<GrupoApu, string> = {
  materiales: "bg-emerald-500",
  mano_obra: "bg-blue-500",
  equipos_herramientas: "bg-amber-500"
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    currency: "PEN",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency"
  }).format(value);
}

export function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}
