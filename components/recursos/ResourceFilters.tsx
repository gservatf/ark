import { Filter, Search } from "lucide-react";
import type { EstadoRegistro, Proveedor, TipoRecurso } from "@/types/domain";
import { resourceStatusLabels, resourceTypeLabels } from "@/components/recursos/resource-ui";

export type ResourceFiltersValue = {
  query: string;
  providerId: string;
  status: "todos" | EstadoRegistro;
  type: "todos" | TipoRecurso;
};

type ResourceFiltersProps = {
  filters: ResourceFiltersValue;
  providers: Proveedor[];
  resultCount: number;
  onChange: (filters: ResourceFiltersValue) => void;
};

const resourceTypes: TipoRecurso[] = ["material", "mano_obra", "equipo", "herramienta"];
const statuses: EstadoRegistro[] = ["activo", "inactivo"];

export function ResourceFilters({
  filters,
  onChange,
  providers,
  resultCount
}: ResourceFiltersProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 flex-1">
          <label className="text-xs font-bold uppercase text-slate-500" htmlFor="resource-search">
            Buscar recurso
          </label>
          <div className="relative mt-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              id="resource-search"
              onChange={(event) => onChange({ ...filters, query: event.target.value })}
              placeholder="Buscar por nombre..."
              value={filters.query}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:w-[680px]">
          <FilterSelect
            label="Tipo"
            onChange={(value) =>
              onChange({ ...filters, type: value as ResourceFiltersValue["type"] })
            }
            value={filters.type}
          >
            <option value="todos">Todos</option>
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {resourceTypeLabels[type]}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Proveedor"
            onChange={(value) => onChange({ ...filters, providerId: value })}
            value={filters.providerId}
          >
            <option value="todos">Todos</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.nombre}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Estado"
            onChange={(value) =>
              onChange({ ...filters, status: value as ResourceFiltersValue["status"] })
            }
            value={filters.status}
          >
            <option value="todos">Todos</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {resourceStatusLabels[status]}
              </option>
            ))}
          </FilterSelect>
        </div>
      </div>

      <div className="mt-4 flex min-w-0 items-start gap-2 text-sm text-slate-500">
        <Filter className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Mostrando <strong className="text-slate-800">{resultCount}</strong> recursos con los filtros actuales
        </span>
      </div>
    </section>
  );
}

function FilterSelect({
  children,
  label,
  onChange,
  value
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <select
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}
