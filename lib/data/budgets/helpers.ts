import type { PresupuestoBorradorPartida, PresupuestoBorradorPartidaRecurso } from "../../../types/domain";

export function buildOfficialBudgetVersionName(draftName: string, nextVersionNumber: number) {
  return `${draftName.replace(/_Presupuesto$/i, "")}_Presupuesto_V${nextVersionNumber}`;
}

export function shouldAutoUpdateDraftResourcePrice(
  line: Pick<PresupuestoBorradorPartida, "precio_fijado">,
  resource: Pick<PresupuestoBorradorPartidaRecurso, "autoactualizar_precio" | "precio_fijado" | "precio_origen">
) {
  return (
    !line.precio_fijado &&
    !resource.precio_fijado &&
    resource.autoactualizar_precio &&
    resource.precio_origen === "catalogo"
  );
}
