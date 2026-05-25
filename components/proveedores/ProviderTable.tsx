import { Edit3, Eye, EyeOff, Power, PowerOff, Trash2, WalletCards } from "lucide-react";
import { memo, useCallback } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import type { Proveedor } from "@/types/domain";
import { formatDate, optionalText } from "@/components/proveedores/provider-ui";

type ProviderTableProps = {
  canMutate: boolean;
  emptyMessage: string;
  onDelete: (provider: Proveedor) => void;
  providers: Proveedor[];
  resourceCounts: Map<string, number>;
  selectedProviderId?: string;
  onToggleStatus: (provider: Proveedor) => void;
  onEdit: (provider: Proveedor) => void;
  onSelect: (provider: Proveedor) => void;
};

export function ProviderTable({
  canMutate,
  emptyMessage,
  onDelete,
  onEdit,
  onSelect,
  onToggleStatus,
  providers,
  resourceCounts,
  selectedProviderId
}: ProviderTableProps) {
  return (
    <DataTable
      description="Contactos comerciales disponibles para recursos y cotizaciones futuras."
      emptyState={
        <EmptyState
          description="Crea un proveedor o restaura la base mock para continuar."
          icon={WalletCards}
          title={emptyMessage}
        />
      }
      isEmpty={providers.length === 0}
      minWidth={1080}
      title="Directorio de proveedores"
    >
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
              <th scope="col" className="px-5 py-3">Proveedor</th>
              <th scope="col" className="px-5 py-3">RUC</th>
              <th scope="col" className="px-5 py-3">Contacto</th>
              <th scope="col" className="px-5 py-3">Telefono</th>
              <th scope="col" className="px-5 py-3">Email</th>
              <th scope="col" className="px-5 py-3 text-center">Recursos</th>
              <th scope="col" className="px-5 py-3">Cliente</th>
              <th scope="col" className="px-5 py-3">Estado</th>
              <th scope="col" className="px-5 py-3">Actualizado</th>
              <th scope="col" className="w-32 px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <ProviderTableRow
                canMutate={canMutate}
                key={provider.id}
                onDelete={onDelete}
                onEdit={onEdit}
                onSelect={onSelect}
                onToggleStatus={onToggleStatus}
                provider={provider}
                resourceCount={resourceCounts.get(provider.id) || 0}
                selected={selectedProviderId === provider.id}
              />
            ))}
          </tbody>
    </DataTable>
  );
}

const ProviderTableRow = memo(function ProviderTableRow({
  canMutate,
  onDelete,
  onEdit,
  onSelect,
  onToggleStatus,
  provider,
  resourceCount,
  selected
}: {
  canMutate: boolean;
  onDelete: (provider: Proveedor) => void;
  onEdit: (provider: Proveedor) => void;
  onSelect: (provider: Proveedor) => void;
  onToggleStatus: (provider: Proveedor) => void;
  provider: Proveedor;
  resourceCount: number;
  selected: boolean;
}) {
  const handleSelect = useCallback(() => onSelect(provider), [onSelect, provider]);
  const handleEdit = useCallback(() => onEdit(provider), [onEdit, provider]);
  const handleDelete = useCallback(() => onDelete(provider), [onDelete, provider]);
  const handleToggleStatus = useCallback(() => onToggleStatus(provider), [onToggleStatus, provider]);

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
          <span className="block truncate font-bold text-slate-800">{provider.nombre}</span>
          <span className="mt-1 block truncate text-xs text-slate-500">
            {optionalText(provider.direccion)}
          </span>
        </button>
      </td>
      <td className="px-5 py-4 font-semibold text-slate-700">{optionalText(provider.ruc)}</td>
      <td className="max-w-[170px] truncate px-5 py-4 text-slate-600">
        {optionalText(provider.contacto)}
      </td>
      <td className="px-5 py-4 text-slate-600">{optionalText(provider.telefono)}</td>
      <td className="max-w-[210px] truncate px-5 py-4 text-slate-600">
        {optionalText(provider.email)}
      </td>
      <td className="px-5 py-4 text-center">
        <span className="inline-flex min-w-10 items-center justify-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
          {resourceCount}
        </span>
      </td>
      <td className="px-5 py-4">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
            provider.disponible_para_cliente
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-500"
          )}
        >
          {provider.disponible_para_cliente ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
          {provider.disponible_para_cliente ? "Visible" : "Interno"}
        </span>
      </td>
      <td className="px-5 py-4">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
            provider.estado === "activo"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-600"
          )}
        >
          {provider.estado === "activo" ? (
            <Power className="h-3.5 w-3.5" />
          ) : (
            <PowerOff className="h-3.5 w-3.5" />
          )}
          {provider.estado === "activo" ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td className="px-5 py-4 text-slate-500">{formatDate(provider.updated_at)}</td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <IconAction
            disabled={!canMutate}
            icon={Edit3}
            label={canMutate ? `Editar ${provider.nombre}` : "Solo admins de proyecto u organización pueden editar"}
            onClick={handleEdit}
          />
          <IconAction
            disabled={!canMutate}
            icon={provider.estado === "activo" ? PowerOff : Power}
            label={
              provider.estado === "inactivo"
                ? `Activar ${provider.nombre}`
                : canMutate
                  ? `Desactivar ${provider.nombre}`
                  : "Solo admins de proyecto u organización pueden cambiar estado"
            }
            onClick={handleToggleStatus}
          />
          <IconAction
            disabled={!canMutate}
            icon={Trash2}
            label={canMutate ? `Eliminar ${provider.nombre}` : "Solo admins de proyecto u organización pueden eliminar"}
            onClick={handleDelete}
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
