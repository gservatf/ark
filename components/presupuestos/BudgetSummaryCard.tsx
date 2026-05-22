import { FileDown, FileSpreadsheet, Share2 } from "lucide-react";
import { formatCurrency } from "@/components/presupuestos/budget-ui";
import type { Presupuesto } from "@/types/domain";

type BudgetSummaryCardProps = {
  budget: Presupuesto;
  hasOfficialVersion: boolean;
  onExportExcel: () => void;
  onExportOfficialExcel: () => void;
  onExportOfficialPdf: () => void;
  onExportPdf: () => void;
};

export function BudgetSummaryCard({
  budget,
  hasOfficialVersion,
  onExportExcel,
  onExportOfficialExcel,
  onExportOfficialPdf,
  onExportPdf
}: BudgetSummaryCardProps) {
  const rows = [
    { label: "Subtotal", value: budget.subtotal },
    {
      label: `Gastos generales (${budget.gastos_generales_porcentaje.toFixed(2)}%)`,
      value: budget.gastos_generales_total
    },
    { label: `Utilidad (${budget.utilidad_porcentaje.toFixed(2)}%)`, value: budget.utilidad_total },
    { label: "Sub total", value: budget.subtotal_con_margen, strong: true },
    { label: `IGV (${budget.igv_porcentaje.toFixed(2)}%)`, value: budget.igv_total }
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-950">Resumen del presupuesto</h2>
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <span className="rounded-lg bg-blue-100 px-4 py-1.5 text-brand-600 shadow-sm">S/</span>
          <span className="px-4 py-1.5 text-slate-400">%</span>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {rows.map((item) => (
          <div className="flex items-center justify-between gap-4 text-sm" key={item.label}>
            <span className={item.strong ? "font-bold text-slate-950" : "text-slate-600"}>{item.label}</span>
            <span className={item.strong ? "font-bold text-slate-950" : "font-semibold text-slate-800"}>
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>

      <div className="my-4 border-t border-slate-200" />

      <div className="flex items-center justify-between gap-4">
        <span className="text-lg font-bold text-brand-600">Total</span>
        <span className="text-2xl font-bold text-brand-600">{formatCurrency(budget.total)}</span>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <p className="font-semibold text-slate-700">Snapshot activo</p>
        <p className="mt-1">Actualizado: {budget.updated_at}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <ActionButton icon={FileDown} onClick={onExportPdf}>
          PDF borrador
        </ActionButton>
        <ActionButton icon={FileSpreadsheet} iconClassName="text-emerald-600" onClick={onExportExcel}>
          Excel borrador
        </ActionButton>
        <ActionButton
          disabled={!hasOfficialVersion}
          icon={FileDown}
          onClick={onExportOfficialPdf}
          title="Emite una versión oficial antes de exportar formalmente"
        >
          PDF oficial
        </ActionButton>
        <ActionButton
          disabled={!hasOfficialVersion}
          icon={FileSpreadsheet}
          iconClassName="text-emerald-600"
          onClick={onExportOfficialExcel}
          title="Emite una versión oficial antes de exportar formalmente"
        >
          Excel oficial
        </ActionButton>
      </div>
      <ActionButton className="mt-3 w-full" disabled icon={Share2} title="Compartir presupuesto pendiente">
        Compartir presupuesto
      </ActionButton>
    </section>
  );
}

function ActionButton({
  children,
  className = "",
  disabled,
  icon: Icon,
  iconClassName = "text-slate-500",
  onClick,
  title
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  icon: React.ElementType;
  iconClassName?: string;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      className={`flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${className}`}
      disabled={disabled}
      onClick={onClick}
      title={disabled ? title || "Acción pendiente" : title}
      type="button"
    >
      <Icon className={`h-4 w-4 ${disabled ? "text-slate-300" : iconClassName}`} />
      {children}
    </button>
  );
}
