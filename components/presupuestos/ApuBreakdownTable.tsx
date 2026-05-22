import { formatCurrency, formatNumber } from "@/components/presupuestos/budget-ui";
import { grupoApuColors, grupoApuLabels } from "@/components/partidas/partida-ui";
import { calculateApuDirectCost, calculateApuResourcePartial } from "@/lib/calculations/apu";
import type { PresupuestoPartida, PresupuestoPartidaRecursoSnapshot } from "@/types/domain";

type ApuBreakdownTableProps = {
  line?: PresupuestoPartida;
  resources: PresupuestoPartidaRecursoSnapshot[];
};

export function ApuBreakdownTable({ line, resources }: ApuBreakdownTableProps) {
  if (!line) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
        <p className="text-sm font-semibold text-slate-700">Selecciona una partida</p>
        <p className="mt-1 text-sm text-slate-500">
          El detalle APU se mostrará con el snapshot de la línea activa.
        </p>
      </div>
    );
  }

  const directTotals = calculateApuDirectCost(resources);
  const groupedResources = resources.reduce<Record<string, PresupuestoPartidaRecursoSnapshot[]>>((groups, resource) => {
    groups[resource.grupo] = [...(groups[resource.grupo] || []), resource];
    return groups;
  }, {});

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-slate-950">
          {line.codigo_snapshot} <span className="font-semibold text-slate-700">{line.nombre_snapshot}</span>
        </h2>
        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-brand-600">{line.unidad_snapshot}</span>
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 text-left">Recurso</th>
                <th scope="col" className="px-5 py-3 text-center">Unidad</th>
                <th scope="col" className="px-5 py-3 text-right">Cantidad</th>
                <th scope="col" className="px-5 py-3 text-right">Costo unit.</th>
                <th scope="col" className="px-5 py-3 text-right">Parcial</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedResources).map(([group, groupResources]) => (
                <ResourceGroup
                  group={group as PresupuestoPartidaRecursoSnapshot["grupo"]}
                  key={group}
                  resources={groupResources}
                />
              ))}
            </tbody>
          </table>
        </div>

        <aside className="rounded-2xl bg-slate-50 p-5">
          <CalcRow
            label="Rendimiento"
            value={line.rendimiento_snapshot ? `${formatNumber(line.rendimiento_snapshot)} ${line.unidad_snapshot} / jor` : "Sin dato"}
          />
          <CalcRow label="Cuadrilla" value={line.cuadrilla_snapshot || "Sin cuadrilla"} />
          <div className="my-3 border-t border-slate-200" />
          <CalcRow label="Costo directo" value={formatCurrency(directTotals.costo_directo)} />
          <CalcRow label="Precio congelado" value={formatCurrency(line.precio_unitario_snapshot)} />
          <div className="mt-5 flex items-center justify-between gap-4">
            <span className="font-bold text-slate-950">Parcial presupuesto</span>
            <span className="text-2xl font-bold text-brand-600">{formatCurrency(line.parcial)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ResourceGroup({
  group,
  resources
}: {
  group: PresupuestoPartidaRecursoSnapshot["grupo"];
  resources: PresupuestoPartidaRecursoSnapshot[];
}) {
  return (
    <>
      <tr className="border-y border-slate-200 bg-slate-50/80">
        <td className="px-5 py-2 text-xs font-bold text-slate-700">
          <span className={`mr-2 inline-block h-2 w-2 rounded-full ${grupoApuColors[group]}`} />
          {grupoApuLabels[group]}
        </td>
        <td className="px-5 py-2 text-center text-xs font-bold text-slate-500">Unidad</td>
        <td className="px-5 py-2 text-right text-xs font-bold text-slate-500">Cantidad</td>
        <td className="px-5 py-2 text-right text-xs font-bold text-slate-500">Costo unit.</td>
        <td className="px-5 py-2 text-right text-xs font-bold text-slate-500">Parcial</td>
      </tr>
      {resources.map((resource) => (
        <tr className="border-b border-slate-100 last:border-b-0" key={resource.id}>
          <td className="px-5 py-2.5 font-medium text-slate-700">
            {resource.nombre_snapshot}
            {resource.proveedor_nombre_snapshot ? (
              <span className="mt-0.5 block text-xs font-normal text-slate-500">
                Proveedor: {resource.proveedor_nombre_snapshot}
              </span>
            ) : null}
          </td>
          <td className="px-5 py-2.5 text-center text-slate-600">{resource.unidad}</td>
          <td className="px-5 py-2.5 text-right text-slate-700">{formatNumber(resource.cantidad, 3)}</td>
          <td className="px-5 py-2.5 text-right text-slate-700">
            {formatNumber(resource.costo_unitario_snapshot)}
          </td>
          <td className="px-5 py-2.5 text-right font-semibold text-slate-800">
            {formatNumber(calculateApuResourcePartial(resource))}
          </td>
        </tr>
      ))}
    </>
  );
}

function CalcRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="font-semibold text-slate-700">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
