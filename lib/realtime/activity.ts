import type { Json } from "@/lib/supabase/types";

export type ActivityRealtimePayload = {
  action: string;
  activityEventId: string;
  actorId: string | null;
  createdAt: string;
  entityId: string | null;
  entityType: string;
  metadata: Record<string, Json>;
  organizacionId: string;
  proyectoId: string | null;
};

export type ActivityTopicScope =
  | { organizacionId: string; type: "org" }
  | { proyectoId: string; type: "project" };

export type ActivityToastMessage = {
  description: string;
  title: string;
};

export function buildActivityTopic(scope: ActivityTopicScope) {
  return scope.type === "org" ? `org:${scope.organizacionId}` : `project:${scope.proyectoId}`;
}

export function parseActivityRealtimePayload(payload: unknown): ActivityRealtimePayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (
    typeof record.activityEventId !== "string" ||
    typeof record.organizacionId !== "string" ||
    typeof record.entityType !== "string" ||
    typeof record.action !== "string" ||
    typeof record.createdAt !== "string"
  ) {
    return null;
  }

  return {
    action: record.action,
    activityEventId: record.activityEventId,
    actorId: typeof record.actorId === "string" ? record.actorId : null,
    createdAt: record.createdAt,
    entityId: typeof record.entityId === "string" ? record.entityId : null,
    entityType: record.entityType,
    metadata: isRecord(record.metadata) ? (record.metadata as Record<string, Json>) : {},
    organizacionId: record.organizacionId,
    proyectoId: typeof record.proyectoId === "string" ? record.proyectoId : null
  };
}

export function createActivityEventDedupe() {
  const seen = new Set<string>();

  return (eventId: string) => {
    if (seen.has(eventId)) {
      return false;
    }

    seen.add(eventId);

    if (seen.size > 200) {
      const oldest = seen.values().next().value;

      if (oldest) {
        seen.delete(oldest);
      }
    }

    return true;
  };
}

export function shouldShowActivityToast(payload: ActivityRealtimePayload, currentActorId?: string) {
  return Boolean(payload.actorId && payload.actorId !== currentActorId);
}

export function shouldRefetchForActivity(payload: ActivityRealtimePayload, currentActorId?: string) {
  return shouldShowActivityToast(payload, currentActorId);
}

export function getActivityToastMessage(payload: ActivityRealtimePayload): ActivityToastMessage {
  const actionLabel = mapActionLabel(payload.action);

  if (payload.entityType === "proyecto") {
    return {
      description: `Se ${actionLabel} un proyecto.`,
      title: "Proyecto actualizado"
    };
  }

  if (payload.entityType.includes("presupuesto")) {
    return {
      description: `Se ${actionLabel} y se actualizó el presupuesto.`,
      title: "Presupuesto actualizado"
    };
  }

  if (payload.entityType === "partida_recurso") {
    return {
      description: `Se ${actionLabel} un recurso del APU.`,
      title: "APU actualizado"
    };
  }

  if (payload.entityType === "partida") {
    return {
      description: `Se ${actionLabel} una partida.`,
      title: "Partida actualizada"
    };
  }

  if (payload.entityType === "recurso") {
    return {
      description: `Se ${actionLabel} un recurso del catálogo.`,
      title: "Recurso actualizado"
    };
  }

  if (payload.entityType === "recurso_proveedor_precio") {
    return {
      description: `Se ${actionLabel} una cotización del recurso.`,
      title: "Cotización actualizada"
    };
  }

  if (payload.entityType === "proveedor") {
    return {
      description: `Se ${actionLabel} un proveedor.`,
      title: "Proveedor actualizado"
    };
  }

  return {
    description: "Hay cambios guardados por otro usuario.",
    title: "Actividad actualizada"
  };
}

function mapActionLabel(action: string) {
  if (action.includes("delete") || action.includes("remove")) {
    return "eliminó";
  }

  if (action.includes("deactivate")) {
    return "desactivó";
  }

  if (action.includes("create") || action.includes("add")) {
    return "creó";
  }

  if (action.includes("emitir") || action.includes("emit")) {
    return "emitió";
  }

  if (action.includes("refresh")) {
    return "actualizó";
  }

  if (action.includes("fix") || action.includes("unfix")) {
    return "cambió";
  }

  return "actualizó";
}

function isRecord(value: unknown) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
