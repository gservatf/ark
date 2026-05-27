import { ArrowRight, Calculator, Edit3, Power, PowerOff } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  formatCurrency,
  partidaStatusLabels
} from "@/components/partidas/partida-ui";
import {
  calculateApuDirectCost
} from "@/lib/calculations/apu";
import { cn } from "@/lib/utils";
import type { Partida, PartidaRecurso } from "@/types/domain";

type PartidaTableProps = {
  canMutate: boolean;
  partidas: Partida[];
  resources: PartidaRecurso[];
  onDeactivate: (partida: Partida) => void;
  onEdit: (partida: Partida) => void;
};

export function PartidaTable({
  canMutate,
  onDeactivate,
  onEdit,
  partidas,
  resources
}: PartidaTableProps) {
  const apuTotalsByPartidaId = useMemo(() => {
    const resourcesByPartidaId = new Map<string, PartidaRecurso[]>();

    for (const resource of resources) {
      resourcesByPartidaId.set(resource.partida_id, [
        ...(resourcesByPartidaId.get(resource.partida_id) || []),
        resource
      ]);
    }

    return new Map(
      partidas.map((partida) => {
        const apuResources = resourcesByPartidaId.get(partida.id) || [];
        const totals = calculateApuDirectCost(apuResources, partida);

        return [
          partida.id,
          {
            directCost: totals.costo_directo,
            resourceCount: apuResources.length,
            unitPrice: totals.costo_directo
          }
        ];
      })
    );
  }, [partidas, resources]);

  return (
    <DataTable
      description="APUs calculados desde recursos y snapshots persistentes."
      emptyState={
        <EmptyState
          description="Ajusta la búsqueda o limpia los filtros para ver más resultados."
          title="No se encontraron partidas"
        />
      }
      isEmpty={partidas.length === 0}
      minWidth={1040}
      title="Catálogo de partidas"
    >
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
              <th scope="col" className="px-5 py-3">Partida</th>
              <th scope="col" className="px-5 py-3">Categoria</th>
              <th scope="col" className="px-5 py-3 text-center">Und.</th>
              <th scope="col" className="px-5 py-3 text-right">Recursos</th>
              <th scope="col" className="px-5 py-3 text-right">Costo directo</th>
              <th scope="col" className="px-5 py-3 text-right">Precio unit.</th>
              <th scope="col" className="px-5 py-3">Estado</th>
              <th scope="col" className="w-52 px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {partidas.map((partida) => {
              const totals = apuTotalsByPartidaId.get(partida.id) || {
                directCost: 0,
                resourceCount: 0,
                unitPrice: 0
              };

              return (
                <tr className="border-b border-slate-100 transition hover:bg-blue-50/50" key={partida.id}>
                  <td className="px-5 py-4">
                    <div className="max-w-[340px]">
                      <p className="font-bold text-slate-900">{partida.codigo || "Sin codigo"}</p>
                      <p className="mt-1 truncate font-medium text-slate-700">{partida.nombre}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {partida.subcategoria || partida.especificaciones || "Sin especificaciones"}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      {partida.categoria || "Sin categoría"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center font-semibold text-slate-600">{partida.unidad}</td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-700">
                    {totals.resourceCount}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-slate-900">
                    {formatCurrency(totals.directCost)}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-brand-600">
                    {formatCurrency(totals.unitPrice)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                        partida.estado === "activo"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      )}
                    >
                      {partida.estado === "activo" ? (
                        <Power className="h-3.5 w-3.5" />
                      ) : (
                        <PowerOff className="h-3.5 w-3.5" />
                      )}
                      {partidaStatusLabels[partida.estado]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <IconAction
                        disabled={!canMutate}
                        icon={Edit3}
                        label={`Editar ${partida.nombre}`}
                        onClick={() => onEdit(partida)}
                      />
                      <IconAction
                        disabled={!canMutate || partida.estado === "inactivo"}
                        icon={PowerOff}
                        label={`Desactivar ${partida.nombre}`}
                        onClick={() => onDeactivate(partida)}
                      />
                      <Link
                        aria-label={`Ver APU de ${partida.nombre}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-brand-600"
                        href={`/partidas/${partida.id}`}
                      >
                        <Calculator className="h-4 w-4" />
                        APU
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
    </DataTable>
  );
}

function IconAction({
  disabled,
  icon: Icon,
  label,
  onClick
}: {
  disabled?: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
