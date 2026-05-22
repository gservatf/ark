import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { resourceRows } from "@/lib/mock-data/dashboard";

export function ResourcesMiniTable() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-950">Base de datos de recursos</h2>
        <Link className="text-xs font-bold text-brand-600 hover:text-brand-700" href="/recursos">
          Ver todos
        </Link>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[330px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500">
              <th scope="col" className="pb-3">Recurso</th>
              <th scope="col" className="pb-3">Proveedor</th>
              <th scope="col" className="pb-3 text-center">Und.</th>
              <th scope="col" className="pb-3 text-right">Costo unit.</th>
              <th scope="col" className="pb-3 text-right">Transporte</th>
            </tr>
          </thead>
          <tbody>
            {resourceRows.map((row) => (
              <tr className="border-b border-slate-100 last:border-0" key={row.resource}>
                <td className="max-w-[115px] truncate py-3 font-semibold text-slate-700">{row.resource}</td>
                <td className="max-w-[96px] truncate py-3 text-slate-500">{row.supplier}</td>
                <td className="py-3 text-center text-slate-600">{row.unit}</td>
                <td className="py-3 text-right font-medium text-slate-700">{row.cost}</td>
                <td className="py-3 text-right text-slate-600">{row.transport}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700" href="/recursos">
        Ver todos los recursos
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
