"use client";

import { useState } from "react";
import { ApuBreakdownTable } from "@/components/presupuestos/ApuBreakdownTable";
import { cn } from "@/lib/utils";
import type { PresupuestoPartida, PresupuestoPartidaRecursoSnapshot } from "@/types/domain";

const apuTabs = [
  "APU / Partida",
  "Recursos de la partida",
  "Especificaciones",
  "Análisis de precios",
  "Rendimiento",
  "Notas"
];

type ApuTabsProps = {
  line?: PresupuestoPartida;
  resources: PresupuestoPartidaRecursoSnapshot[];
};

export function ApuTabs({ line, resources }: ApuTabsProps) {
  const [activeTab, setActiveTab] = useState(apuTabs[0]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max">
          {apuTabs.map((tab) => (
            <button
              className={cn(
                "relative h-12 px-5 text-sm font-semibold text-slate-500 transition hover:text-brand-600",
                activeTab === tab && "text-brand-600"
              )}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
              {activeTab === tab ? (
                <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-brand-600" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {activeTab === "APU / Partida" ? (
          <ApuBreakdownTable line={line} resources={resources} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="text-sm font-semibold text-slate-700">{activeTab}</p>
            <p className="mt-1 text-sm text-slate-500">
              Vista mock preparada para enriquecer el presupuesto sin backend.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
