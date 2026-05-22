import { Activity, ArrowUpRight, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Proveedor, Recurso, RecursoPrecioHistorial } from "@/types/domain";
import {
  formatCurrency,
  formatDate,
  resourceStatusLabels,
  resourceTypeLabels
} from "@/components/recursos/resource-ui";

type ResourceHistoryPanelProps = {
  history: RecursoPrecioHistorial[];
  providers: Proveedor[];
  resource?: Recurso;
};

export function ResourceHistoryPanel({
  history,
  providers,
  resource
}: ResourceHistoryPanelProps) {
  const provider = providers.find((item) => item.id === resource?.proveedor_id);

  return (
    <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Historial de precios</h2>
          <p className="mt-1 text-sm text-slate-500">
            {resource ? resource.nombre : "Selecciona un recurso para ver sus cambios."}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand-600">
          <History className="h-5 w-5" />
        </span>
      </div>

      {resource ? (
        <>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase text-slate-500">
                {resourceTypeLabels[resource.tipo]}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-bold",
                  resource.estado === "activo"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                )}
              >
                {resourceStatusLabels[resource.estado]}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-950">
              {formatCurrency(resource.costo_unitario_actual)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Transporte:{" "}
              <strong className="text-slate-700">
                {resource.transporte_aplica ? formatCurrency(resource.costo_transporte) : "No aplica"}
              </strong>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Proveedor: <strong className="text-slate-700">{provider?.nombre || "Sin proveedor"}</strong>
            </p>
          </div>

          <ol className="mt-5 grid gap-4 xl:grid-cols-2 2xl:block 2xl:space-y-4">
            {history.map((item) => {
              const variation = item.costo_unitario_nuevo - item.costo_unitario_anterior;

              return (
                <li className="relative pl-8" key={item.id}>
                  <span className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-brand-600">
                    <Activity className="h-3.5 w-3.5" />
                  </span>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{formatDate(item.fecha)}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.fuente_precio || "Sin fuente registrada"}</p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                          variation >= 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        {variation >= 0 ? "+" : ""}
                        {formatCurrency(variation)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <PriceBox label="Anterior" value={item.costo_unitario_anterior} />
                      <PriceBox label="Nuevo" value={item.costo_unitario_nuevo} strong />
                    </div>
                    {item.notas ? <p className="mt-3 text-xs text-slate-500">{item.notas}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>

          {history.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-center">
              <p className="text-sm font-bold text-slate-700">Sin historial registrado</p>
              <p className="mt-1 text-xs text-slate-500">
                Edita el costo del recurso para registrar una variacion.
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-center">
          <p className="text-sm font-bold text-slate-700">Sin recurso seleccionado</p>
          <p className="mt-1 text-xs text-slate-500">
            Usa el icono de historial en la tabla para inspeccionar variaciones.
          </p>
        </div>
      )}
    </aside>
  );
}

function PriceBox({
  label,
  strong,
  value
}: {
  label: string;
  strong?: boolean;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="font-semibold uppercase text-slate-400">{label}</p>
      <p className={cn("mt-1 font-bold", strong ? "text-slate-950" : "text-slate-600")}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
