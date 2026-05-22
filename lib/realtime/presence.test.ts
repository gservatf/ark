import { describe, expect, it } from "vitest";

import {
  buildPresenceTopic,
  buildPresenceNotice,
  getPresenceActorIds,
  parsePresenceState,
  resolvePresenceIdentity,
  summarizePresence
} from "./presence";

describe("presence helpers", () => {
  it("usa topics dedicados para no colisionar con Broadcast", () => {
    expect(buildPresenceTopic({ organizacionId: "org-1", type: "org" })).toBe("presence:org:org-1");
    expect(buildPresenceTopic({ proyectoId: "project-1", type: "project" })).toBe("presence:project:project-1");
  });

  it("resuelve identidad desde perfiles confiables", () => {
    expect(
      resolvePresenceIdentity("user-1", {
        "user-1": {
          display_name: "editor",
          email: "editor@cyp.local",
          email_verified: true,
          user_id: "user-1"
        }
      })
    ).toEqual({
      actorEmail: "editor@cyp.local",
      actorName: "editor",
      emailVerified: true
    });

    expect(resolvePresenceIdentity("user-2")).toEqual({
      actorEmail: null,
      actorName: "Usuario colaborador",
      emailVerified: false
    });
  });

  it("oculta nombres derivados de perfiles sin email verificado", () => {
    expect(
      resolvePresenceIdentity("user-1", {
        "user-1": {
          display_name: "sin-verificar",
          email: null,
          email_verified: false,
          user_id: "user-1"
        }
      })
    ).toEqual({
      actorEmail: null,
      actorName: "Usuario colaborador",
      emailVerified: false
    });
  });

  it("parsea presence state excluyendo al actor actual e ignorando nombres del payload", () => {
    const users = parsePresenceState(
      {
        "user-1": [
          {
            actorId: "user-1",
            lastSeenAt: "2026-05-20T00:00:00Z",
            page: "/partidas"
          }
        ],
        "user-2": [
          {
            actorId: "user-2",
            actorEmail: "spoofed@example.com",
            actorName: "Nombre falso",
            editing: { id: "part-1", label: "Tarrajeo", type: "partida" },
            lastSeenAt: "2026-05-20T00:00:01Z",
            page: "/partidas"
          }
        ]
      },
      "user-1",
      {
        "user-2": {
          display_name: "Maria",
          email: "maria@cyp.local",
          email_verified: true,
          user_id: "user-2"
        }
      }
    );

    expect(users).toHaveLength(1);
    expect(users[0].actorName).toBe("Maria");
    expect(users[0].actorEmail).toBe("maria@cyp.local");
  });

  it("lista actores remotos para resolver perfiles", () => {
    expect(
      getPresenceActorIds(
        {
          own: [{ actorId: "user-1", lastSeenAt: "2026-05-20T00:00:00Z", page: "/" }],
          remote: [
            { actorId: "user-2", lastSeenAt: "2026-05-20T00:00:00Z", page: "/" },
            { actorId: "user-2", lastSeenAt: "2026-05-20T00:00:01Z", page: "/" }
          ],
          invalid: [{ actorId: "user-3" }]
        },
        "user-1"
      )
    ).toEqual(["user-2"]);
  });

  it("resume usuarios editando el mismo objetivo", () => {
    const target = { id: "part-1", label: "Tarrajeo", type: "partida" };
    const summary = summarizePresence(
      [
        {
          actorId: "user-2",
          actorName: "Maria",
          editing: target,
          lastSeenAt: "2026-05-20T00:00:01Z",
          page: "/partidas",
          presenceId: "user-2"
        }
      ],
      target
    );

    expect(summary.editing).toHaveLength(1);
    expect(buildPresenceNotice(summary)).toContain("Maria está editando Tarrajeo");
  });
});
