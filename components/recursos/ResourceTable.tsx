import { Edit3, History, Power, PowerOff } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import type { Proveedor, Recurso } from "@/types/domain";
import {
  formatCurrency,
  formatDate,
  resourceStatusLabels,
  resourceTypeLabels
} from "@/components/recursos/resource-ui";

type ResourceTableProps = {
  canMutate?: boolean;
  providers: Proveedor[];
  resources: Recurso[];
  selectedResourceId?: string;
  onDeactivate: (resource: Recurso) => void;
  onEdit: (resource: Recurso) => void;
  onSelect: (resource: Recurso) => void;
};

export function ResourceTable({
  canMutate = true,
  onDeactivate,
  onEdit,
  onSelect,
  providers,
  resources,
  selectedResourceId
}: ResourceTableProps) {
  const providerMap = useMemo(
    () => new Map(providers.map((provider) => [provider.id, provider.nombre])),
    [providers]
  );

  return (
    <DataTable
      description="Costos vigentes disponibles para partidas y presupuestos futuros."
      emptyState={
        <EmptyState
          description="Ajusta la búsqueda o limpia los filtros para ver más resultados."
          title="No se encontraron recursos"
        />
      }
      isEmpty={resources.length === 0}
      minWidth={1040}
      title="Base de recursos"
    >
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
              <th scope="col" className="px-5 py-3">Recurso</th>
              <th scope="col" className="px-5 py-3">Tipo</th>
              <th scope="col" className="px-5 py-3">Proveedor</th>
              <th scope="col" className="px-5 py-3 text-center">Und.</th>
              <th scope="col" className="px-5 py-3 text-right">Costo unit.</th>
              <th scope="col" className="px-5 py-3 text-right">Transporte</th>
              <th scope="col" className="px-5 py-3">Estado</th>
              <th scope="col" className="px-5 py-3">Actualizado</th>
              <th scope="col" className="w-40 px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <ResourceTableRow
                canMutate={canMutate}
                key={resource.id}
                onDeactivate={onDeactivate}
                onEdit={onEdit}
                onSelect={onSelect}
                providerName={resource.proveedor_id ? providerMap.get(resource.proveedor_id) : "Sin proveedor"}
                resource={resource}
                selected={selectedResourceId === resource.id}
              />
            ))}
          </tbody>
    </DataTable>
  );
}

const ResourceTableRow = memo(function ResourceTableRow({
  canMutate,
  onDeactivate,
  onEdit,
  onSelect,
  providerName,
  resource,
  selected
}: {
  canMutate: boolean;
  onDeactivate: (resource: Recurso) => void;
  onEdit: (resource: Recurso) => void;
  onSelect: (resource: Recurso) => void;
  providerName?: string;
  resource: Recurso;
  selected: boolean;
}) {
  const handleSelect = useCallback(() => onSelect(resource), [onSelect, resource]);
  const handleEdit = useCallback(() => onEdit(resource), [onEdit, resource]);
  const handleDeactivate = useCallback(() => onDeactivate(resource), [onDeactivate, resource]);

  return (
    <tr
      className={cn(
        "border-b border-slate-100 transition hover:bg-blue-50/50",
        selected && "bg-blue-50/70"
      )}
    >
      <td className="px-5 py-4">
        <button
          className="block max-w-[250px] text-left"
          onClick={handleSelect}
          type="button"
        >
          <span className="block truncate font-bold text-slate-800">{resource.nombre}</span>
          <span className="mt-1 block truncate text-xs text-slate-500">
            {resource.marca || resource.especificacion || "Sin especificacion"}
          </span>
        </button>
      </td>
      <td className="px-5 py-4">
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
          {resourceTypeLabels[resource.tipo]}
        </span>
      </td>
      <td className="max-w-[180px] truncate px-5 py-4 font-medium text-slate-600">
        {providerName}
      </td>
      <td className="px-5 py-4 text-center font-semibold text-slate-600">{resource.unidad}</td>
      <td className="px-5 py-4 text-right font-bold text-slate-900">
        {formatCurrency(resource.costo_unitario_actual)}
      </td>
      <td className="px-5 py-4 text-right font-medium text-slate-600">
        {resource.transporte_aplica ? formatCurrency(resource.costo_transporte) : "-"}
      </td>
      <td className="px-5 py-4">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
            resource.estado === "activo"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-600"
          )}
        >
          {resource.estado === "activo" ? (
            <Power className="h-3.5 w-3.5" />
          ) : (
            <PowerOff className="h-3.5 w-3.5" />
          )}
          {resourceStatusLabels[resource.estado]}
        </span>
      </td>
      <td className="px-5 py-4 text-slate-500">
        {formatDate(resource.fecha_actualizacion_precio)}
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <IconAction icon={History} label={`Ver historial de ${resource.nombre}`} onClick={handleSelect} />
          <IconAction
            disabled={!canMutate}
            icon={Edit3}
            label={`Editar ${resource.nombre}`}
            onClick={handleEdit}
          />
          <IconAction
            disabled={!canMutate || resource.estado === "inactivo"}
            icon={PowerOff}
            label={`Desactivar ${resource.nombre}`}
            onClick={handleDeactivate}
          />
        </div>
      </td>
    </tr>
  );
});

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
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
