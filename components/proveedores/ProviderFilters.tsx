import { Filter, Search } from "lucide-react";
import { Button } from "@/components/shared/Button";
import type { EstadoRegistro } from "@/types/domain";

export type ProviderFiltersValue = {
  clientVisibility: "todos" | "visible" | "interno";
  query: string;
  status: EstadoRegistro | "todos";
};

type ProviderFiltersProps = {
  filters: ProviderFiltersValue;
  resultCount: number;
  onChange: (filters: ProviderFiltersValue) => void;
};

export function ProviderFilters({
  filters,
  onChange,
  resultCount
}: ProviderFiltersProps) {
  const statusOptions: Array<{ label: string; value: ProviderFiltersValue["status"] }> = [
    { label: "Todos", value: "todos" },
    { label: "Activos", value: "activo" },
    { label: "Inactivos", value: "inactivo" }
  ];
  const visibilityOptions: Array<{ label: string; value: ProviderFiltersValue["clientVisibility"] }> = [
    { label: "Todos cliente", value: "todos" },
    { label: "Visibles", value: "visible" },
    { label: "Internos", value: "interno" }
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 flex-1">
          <label className="text-xs font-bold uppercase text-slate-500" htmlFor="provider-search">
            Buscar proveedor
          </label>
          <div className="relative mt-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              id="provider-search"
              onChange={(event) => onChange({ ...filters, query: event.target.value })}
              placeholder="Buscar por nombre o RUC..."
              value={filters.query}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {visibilityOptions.map((option) => (
            <Button
              aria-pressed={filters.clientVisibility === option.value}
              key={option.value}
              onClick={() => onChange({ ...filters, clientVisibility: option.value })}
              variant={filters.clientVisibility === option.value ? "primary" : "secondary"}
            >
              {option.label}
            </Button>
          ))}
          {statusOptions.map((option) => (
            <Button
              aria-pressed={filters.status === option.value}
              key={option.value}
              onClick={() => onChange({ ...filters, status: option.value })}
              variant={filters.status === option.value ? "primary" : "secondary"}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex min-w-0 items-start gap-2 text-sm text-slate-500">
        <Filter className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Mostrando <strong className="text-slate-800">{resultCount}</strong> proveedores con la
          búsqueda actual
        </span>
      </div>
    </section>
  );
}
