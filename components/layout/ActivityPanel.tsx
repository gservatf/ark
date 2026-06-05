"use client";

import { Bell, Clock, Wifi } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { listActivityEvents } from "@/lib/data/activity";
import { createDataBrowserClient } from "@/lib/data/browser-client";
import type { DataScope } from "@/lib/data/types";
import {
  getActivityToastMessage,
  type ActivityRealtimePayload
} from "@/lib/realtime/activity";
import type { ActivityConnectionStatus } from "@/lib/realtime/useActivitySubscription";
import type { ActivityEvent } from "@/types/domain";

type ActivityPanelProps = {
  open: boolean;
  scope: DataScope | null;
  status?: ActivityConnectionStatus;
};

export function ActivityPanel({ open, scope, status }: ActivityPanelProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!scope) {
      return;
    }

    setIsLoading(true);
    setError(null);
    const result = await listActivityEvents(createDataBrowserClient(), scope);

    if (!result.ok) {
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    setEvents(result.data);
    setIsLoading(false);
  }, [scope]);

  useEffect(() => {
    if (open) {
      void loadEvents();
    }
  }, [loadEvents, open]);

  if (!open) {
    return null;
  }

  return (
    <section className="absolute right-0 top-12 z-40 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-950">Actividad reciente</h2>
            <p className="mt-1 text-xs text-slate-500">Cambios guardados por el equipo.</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            <Wifi className="h-3.5 w-3.5" />
            {status === "connected" ? "En vivo" : status === "error" ? "Sin conexion" : "Conectando"}
          </span>
        </div>
      </div>
      <div className="max-h-[460px] overflow-y-auto p-2">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Cargando actividad...</p>
        ) : error ? (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
        ) : events.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-800">Sin actividad reciente</p>
            <p className="mt-1 text-xs text-slate-500">Los cambios colaborativos apareceran aqui.</p>
          </div>
        ) : (
          events.map((event) => {
            const message = getActivityToastMessage(toRealtimePayload(event));

            return (
              <article className="rounded-xl p-3 transition hover:bg-slate-50" key={event.id}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand-600">
                    <Bell className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{message.title}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{message.description}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {formatActivityDate(event.created_at)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function toRealtimePayload(event: ActivityEvent): ActivityRealtimePayload {
  return {
    action: event.action,
    activityEventId: event.id,
    actorId: event.actor_id || null,
    createdAt: event.created_at,
    entityId: event.entity_id || null,
    entityType: event.entity_type,
    metadata: (event.metadata || {}) as ActivityRealtimePayload["metadata"],
    organizacionId: event.organizacion_id,
    proyectoId: event.proyecto_id || null
  };
}

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
