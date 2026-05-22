"use client";

import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  FileClock,
  FileText,
  HelpCircle,
  Home,
  Settings,
  Users,
  WalletCards
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useWorkspaceNavigation } from "./useWorkspaceNavigation";

export const menuItems = [
  { label: "Dashboard", icon: Home, href: "/" },
  { label: "Presupuestos", icon: ClipboardList, href: "/presupuestos" },
  { label: "Cronogramas", icon: CalendarDays, href: "/cronogramas" },
  { label: "Partidas / APU", icon: FileText, href: "/partidas" },
  { label: "Proveedores", icon: WalletCards, href: "/proveedores" },
  { label: "Recursos", icon: Users, href: "/recursos" },
  { label: "Reportes", icon: BarChart3, href: "/reportes" },
  { label: "Historial de precios", icon: FileClock, disabled: true },
  { label: "Configuración", icon: Settings, disabled: true }
];

export function Sidebar() {
  const pathname = usePathname();
  const { activeProject } = useWorkspaceNavigation();
  const projectProgress = 0;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] flex-col bg-navy-950 text-white lg:flex">
      <div className="flex h-24 items-center gap-4 border-b border-white/10 px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-construction-500/15 text-construction-400">
          <Building2 className="h-9 w-9" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">C y P</p>
          <p className="mt-1 max-w-[150px] text-[11px] font-semibold uppercase leading-4 text-slate-300">
            Sistema de Costos y Presupuestos
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-5">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : Boolean(item.href && pathname.startsWith(item.href));

          return item.disabled ? (
            <span
              className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500"
              key={item.label}
              title="Disponible en un goal pendiente"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </span>
          ) : (
            <a
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white",
                isActive && "bg-blue-600/35 text-white shadow-sm"
              )}
              href={item.href}
              key={item.label}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="space-y-3 px-4 pb-5">
        <article className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
          <p className="text-xs text-slate-400">Proyecto actual</p>
          <h2 className="mt-1 text-sm font-semibold leading-5">
            {activeProject?.nombre || "Sin proyecto seleccionado"}
          </h2>
          <div className="mt-3 h-24 overflow-hidden rounded-xl bg-gradient-to-br from-sky-200 via-slate-100 to-amber-100">
            <div className="flex h-full items-end justify-center gap-1 px-6 pb-0">
              {[68, 88, 74, 94, 80, 64].map((height, index) => (
                <span
                  className="w-5 rounded-t bg-slate-600/80 shadow-sm"
                  key={index}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-300">Avance del presupuesto</span>
            <span className="font-semibold text-white">{projectProgress}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/12">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-construction-400"
              style={{ width: `${projectProgress}%` }}
            />
          </div>
        </article>

        <button
          className="flex h-14 w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-slate-400"
          disabled
          title="Centro de ayuda pendiente"
        >
          <HelpCircle className="h-5 w-5" />
          Centro de ayuda
        </button>
      </div>
    </aside>
  );
}
