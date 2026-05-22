import { Calculator } from "lucide-react";
import {
  formatCurrency,
  grupoApuLabels
} from "@/components/partidas/partida-ui";
import type { ApuDirectCostTotals, ApuUnitPriceTotals } from "@/lib/calculations/apu";

type ApuSummaryCardProps = {
  directTotals: ApuDirectCostTotals;
  gastosGenerales: number;
  unitPrice: ApuUnitPriceTotals;
  utilidad: number;
};

export function ApuSummaryCard({
  directTotals,
  gastosGenerales,
  unitPrice,
  utilidad
}: ApuSummaryCardProps) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-brand-600">
          <Calculator className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Resumen APU</h2>
          <p className="mt-1 text-sm text-slate-500">Costo directo y precio unitario.</p>
        </div>
      </div>

      <div className="mt-5 space-y-1">
        <CalcRow label={grupoApuLabels.materiales} value={formatCurrency(directTotals.costo_materiales)} />
        <CalcRow label={grupoApuLabels.mano_obra} value={formatCurrency(directTotals.costo_mano_obra)} />
        <CalcRow
          label={grupoApuLabels.equipos_herramientas}
          value={formatCurrency(directTotals.costo_equipos_herramientas)}
        />
        <div className="my-3 border-t border-slate-200" />
        <CalcRow label="Costo directo" strong value={formatCurrency(directTotals.costo_directo)} />
        <CalcRow
          label={`Gastos generales (${gastosGenerales}%)`}
          value={formatCurrency(unitPrice.gastos_generales)}
        />
        <CalcRow label={`Utilidad (${utilidad}%)`} value={formatCurrency(unitPrice.utilidad)} />
      </div>

      <div className="mt-5 rounded-2xl bg-blue-50 p-4">
        <p className="text-sm font-bold text-slate-700">Precio unitario</p>
        <p className="mt-1 text-3xl font-bold text-brand-600">
          {formatCurrency(unitPrice.precio_unitario)}
        </p>
      </div>
    </aside>
  );
}

function CalcRow({
  label,
  strong,
  value
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="font-semibold text-slate-700">{label}</span>
      <span className={strong ? "font-bold text-slate-950" : "font-medium text-slate-800"}>
        {value}
      </span>
    </div>
  );
}
