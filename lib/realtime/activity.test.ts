import { describe, expect, it } from "vitest";

import {
  buildActivityTopic,
  createActivityEventDedupe,
  getActivityToastMessage,
  parseActivityRealtimePayload,
  shouldRefetchForActivity,
  shouldShowActivityToast
} from "./activity";

describe("activity realtime helpers", () => {
  it("construye topics privados por organizacion y proyecto", () => {
    expect(buildActivityTopic({ organizacionId: "org-1", type: "org" })).toBe("org:org-1");
    expect(buildActivityTopic({ proyectoId: "project-1", type: "project" })).toBe("project:project-1");
  });

  it("parsea solo payloads completos de actividad", () => {
    expect(parseActivityRealtimePayload(null)).toBeNull();
    expect(parseActivityRealtimePayload({ activityEventId: "event-1" })).toBeNull();
    expect(
      parseActivityRealtimePayload({
        action: "update",
        activityEventId: "event-1",
        actorId: "user-2",
        createdAt: "2026-05-20T12:00:00Z",
        entityId: "line-1",
        entityType: "presupuesto_borrador_partida",
        metadata: { repository: "budgetsRepository" },
        organizacionId: "org-1",
        proyectoId: "project-1"
      })
    ).toEqual({
      action: "update",
      activityEventId: "event-1",
      actorId: "user-2",
      createdAt: "2026-05-20T12:00:00Z",
      entityId: "line-1",
      entityType: "presupuesto_borrador_partida",
      metadata: { repository: "budgetsRepository" },
      organizacionId: "org-1",
      proyectoId: "project-1"
    });
  });

  it("deduplica eventos por id", () => {
    const dedupe = createActivityEventDedupe();

    expect(dedupe("event-1")).toBe(true);
    expect(dedupe("event-1")).toBe(false);
    expect(dedupe("event-2")).toBe(true);
  });

  it("oculta toasts del actor actual pero mantiene los externos", () => {
    const payload = {
      action: "update",
      activityEventId: "event-1",
      actorId: "user-1",
      createdAt: "2026-05-20T12:00:00Z",
      entityId: "line-1",
      entityType: "presupuesto_borrador_partida",
      metadata: {},
      organizacionId: "org-1",
      proyectoId: "project-1"
    };

    expect(shouldShowActivityToast(payload, "user-1")).toBe(false);
    expect(shouldShowActivityToast(payload, "user-2")).toBe(true);
    expect(shouldRefetchForActivity(payload, "user-1")).toBe(false);
    expect(shouldRefetchForActivity(payload, "user-2")).toBe(true);
  });

  it("mapea mensajes en espanol por entidad", () => {
    expect(
      getActivityToastMessage({
        action: "create",
        activityEventId: "event-0",
        actorId: "user-2",
        createdAt: "2026-05-20T12:00:00Z",
        entityId: "project-1",
        entityType: "proyecto",
        metadata: {},
        organizacionId: "org-1",
        proyectoId: "project-1"
      })
    ).toEqual({
      description: "Se creó un proyecto.",
      title: "Proyecto actualizado"
    });

    expect(
      getActivityToastMessage({
        action: "add_partida",
        activityEventId: "event-1",
        actorId: "user-2",
        createdAt: "2026-05-20T12:00:00Z",
        entityId: "line-1",
        entityType: "presupuesto_borrador_partida",
        metadata: {},
        organizacionId: "org-1",
        proyectoId: "project-1"
      })
    ).toEqual({
      description: "Se creó y se actualizó el presupuesto.",
      title: "Presupuesto actualizado"
    });

    expect(
      getActivityToastMessage({
        action: "update",
        activityEventId: "event-2",
        actorId: "user-2",
        createdAt: "2026-05-20T12:00:00Z",
        entityId: "resource-1",
        entityType: "recurso",
        metadata: {},
        organizacionId: "org-1",
        proyectoId: null
      }).title
    ).toBe("Recurso actualizado");
  });
});
