import { Filter, Search } from "lucide-react";
import type { EstadoPartida } from "@/types/domain";
import { partidaStatusLabels } from "@/components/partidas/partida-ui";

export type PartidaFiltersValue = {
  category: string;
  query: string;
  status: "todos" | EstadoPartida;
};

type PartidaFiltersProps = {
  categories: string[];
  filters: PartidaFiltersValue;
  resultCount: number;
  onChange: (filters: PartidaFiltersValue) => void;
};

export function PartidaFilters({
  categories,
  filters,
  onChange,
  resultCount
}: PartidaFiltersProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 flex-1">
          <label className="text-xs font-bold uppercase text-slate-500" htmlFor="partida-search">
            Buscar partida
          </label>
          <div className="relative mt-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              id="partida-search"
              onChange={(event) => onChange({ ...filters, query: event.target.value })}
              placeholder="Buscar por código o nombre..."
              value={filters.query}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:w-[460px]">
          <FilterSelect
            label="Categoria"
            onChange={(value) => onChange({ ...filters, category: value })}
            value={filters.category}
          >
            <option value="todas">Todas</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Estado"
            onChange={(value) =>
              onChange({ ...filters, status: value as PartidaFiltersValue["status"] })
            }
            value={filters.status}
          >
            <option value="todos">Todos</option>
            <option value="activo">{partidaStatusLabels.activo}</option>
            <option value="inactivo">{partidaStatusLabels.inactivo}</option>
          </FilterSelect>
        </div>
      </div>

      <div className="mt-4 flex min-w-0 items-start gap-2 text-sm text-slate-500">
        <Filter className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Mostrando <strong className="text-slate-800">{resultCount}</strong> partidas con los filtros actuales
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
