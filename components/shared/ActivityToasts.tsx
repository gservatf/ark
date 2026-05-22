"use client";

import { Wifi, X } from "lucide-react";
import React from "react";

import type { ActivityConnectionStatus } from "@/lib/realtime/useActivitySubscription";

type ActivityToast = {
  description: string;
  id: string;
  title: string;
};

export function ActivityToasts({
  onDismiss,
  status,
  toasts
}: {
  onDismiss: (id: string) => void;
  status?: ActivityConnectionStatus;
  toasts: ActivityToast[];
}) {
  if (toasts.length === 0 && status !== "error") {
    return null;
  }

  return (
    <div
      aria-atomic="false"
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-50 grid w-[min(360px,calc(100vw-2rem))] gap-3"
      role="status"
    >
      {status === "error" ? (
        <article className="pointer-events-auto rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm shadow-lg">
          <div className="flex items-start gap-3">
            <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0">
              <p className="font-bold text-amber-900">Realtime desconectado</p>
              <p className="mt-1 text-amber-800">Usa Recargar si necesitas ver cambios recientes.</p>
            </div>
          </div>
        </article>
      ) : null}

      {toasts.map((toast) => (
        <article
          className="pointer-events-auto rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-lg shadow-slate-200/70"
          key={toast.id}
        >
          <div className="flex items-start gap-3">
            <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-950">{toast.title}</p>
              <p className="mt-1 text-slate-600">{toast.description}</p>
            </div>
            <button
              aria-label="Cerrar aviso"
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={() => onDismiss(toast.id)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
