import { Edit3, Trash2 } from "lucide-react";
import {
  formatCurrency,
  formatNumber,
  grupoApuColors,
  grupoApuLabels
} from "@/components/partidas/partida-ui";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { calculateApuResourcePartial } from "@/lib/calculations/apu";
import type { GrupoApu, PartidaRecurso, Recurso } from "@/types/domain";

type ApuResourcesTableProps = {
  canMutate: boolean;
  resources: PartidaRecurso[];
  resourceCatalog: Recurso[];
  isSubmitting?: boolean;
  onEdit: (resource: PartidaRecurso) => void;
  onRemove: (resourceId: string) => void;
};

const groupOrder: GrupoApu[] = ["materiales", "mano_obra", "equipos_herramientas"];

export function ApuResourcesTable({
  canMutate,
  isSubmitting = false,
  onEdit,
  onRemove,
  resourceCatalog,
  resources
}: ApuResourcesTableProps) {
  const resourceMap = new Map(resourceCatalog.map((resource) => [resource.id, resource]));

  return (
    <DataTable
      description="Recursos agrupados con parciales calculados desde snapshots persistentes."
      emptyState={
        <EmptyState
          description="Agrega recursos desde el panel para construir el APU."
          title="Esta partida no tiene recursos"
        />
      }
      isEmpty={resources.length === 0}
      minWidth={1040}
      title="Builder APU"
    >
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
              <th scope="col" className="px-5 py-3">Recurso</th>
              <th scope="col" className="px-5 py-3 text-center">Und.</th>
              <th scope="col" className="px-5 py-3 text-right">Base/Cuadrilla</th>
              <th scope="col" className="px-5 py-3 text-right">Cantidad</th>
              <th scope="col" className="px-5 py-3 text-right">Costo unit.</th>
              <th scope="col" className="px-5 py-3 text-right">Transporte</th>
              <th scope="col" className="px-5 py-3 text-right">Parcial</th>
              <th scope="col" className="w-28 px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {groupOrder.map((group) => {
              const groupResources = resources
                .filter((resource) => resource.grupo === group)
                .sort((a, b) => a.orden - b.orden);

              if (groupResources.length === 0) {
                return null;
              }

              return (
                <ResourceGroup
                  group={group}
                  canMutate={canMutate}
                  isSubmitting={isSubmitting}
                  key={group}
                  onEdit={onEdit}
                  onRemove={onRemove}
                  resourceMap={resourceMap}
                  resources={groupResources}
                />
              );
            })}
          </tbody>
    </DataTable>
  );
}

function ResourceGroup({
  group,
  canMutate,
  isSubmitting,
  onEdit,
  onRemove,
  resourceMap,
  resources
}: {
  group: GrupoApu;
  canMutate: boolean;
  isSubmitting: boolean;
  onEdit: (resource: PartidaRecurso) => void;
  onRemove: (resourceId: string) => void;
  resourceMap: Map<string, Recurso>;
  resources: PartidaRecurso[];
}) {
  return (
    <>
      <tr className="border-y border-slate-200 bg-slate-50/80">
        <td className="px-5 py-2 text-xs font-bold text-slate-700" colSpan={8}>
          <span className={`mr-2 inline-block h-2 w-2 rounded-full ${grupoApuColors[group]}`} />
          {grupoApuLabels[group]}
        </td>
      </tr>
      {resources.map((resource) => {
        const catalogResource = resourceMap.get(resource.recurso_id);
        const partial = calculateApuResourcePartial(resource);
        const baseValue = resource.tipo_calculo_apu === "herramientas_porcentaje_mano_obra"
          ? `${formatNumber(resource.porcentaje_aplicado ?? 3)}%`
          : resource.cuadrilla !== null && resource.cuadrilla !== undefined
            ? formatNumber(resource.cuadrilla, 3)
            : formatNumber(resource.cantidad_base ?? resource.cantidad, 3);

        return (
          <tr className="border-b border-slate-100 last:border-b-0" key={resource.id}>
            <td className="px-5 py-3">
              <p className="max-w-[260px] truncate font-bold text-slate-800">
                {catalogResource?.nombre || resource.recurso_id}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Snapshot APU #{resource.orden}
              </p>
            </td>
            <td className="px-5 py-3 text-center font-semibold text-slate-600">{resource.unidad}</td>
            <td className="px-5 py-3 text-right text-slate-700">
              {baseValue}
            </td>
            <td className="px-5 py-3 text-right text-slate-700">
              {formatNumber(resource.cantidad, 3)}
            </td>
            <td className="px-5 py-3 text-right text-slate-700">
              {formatCurrency(resource.costo_unitario_snapshot)}
            </td>
            <td className="px-5 py-3 text-right text-slate-700">
              {formatCurrency(resource.costo_transporte_snapshot)}
            </td>
            <td className="px-5 py-3 text-right font-bold text-slate-900">
              {formatCurrency(partial)}
            </td>
            <td className="px-5 py-3">
              <div className="flex justify-end gap-2">
                <IconAction
                  disabled={!canMutate || isSubmitting}
                  icon={Edit3}
                  label={`Editar ${catalogResource?.nombre || resource.recurso_id} en APU`}
                  onClick={() => onEdit(resource)}
                />
                <IconAction
                  disabled={!canMutate || isSubmitting}
                  icon={Trash2}
                  label={`Quitar ${catalogResource?.nombre || resource.recurso_id} del APU`}
                  onClick={() => onRemove(resource.id)}
                />
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}

function IconAction({
  icon: Icon,
  disabled,
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
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
