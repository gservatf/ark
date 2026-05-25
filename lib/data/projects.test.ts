import { describe, expect, it } from "vitest";

import type { DataClient } from "./types";
import { createProject } from "./projects";
import { projectInputSchema } from "../validations/projects";

const scope = {
  actorId: "user-1",
  organizacionId: "org-1"
};

describe("projects repository", () => {
  it("valida nombre obligatorio y normaliza campos opcionales", () => {
    expect(projectInputSchema.safeParse({ nombre: "" }).success).toBe(false);

    const parsed = projectInputSchema.safeParse({
      cliente: "",
      nombre: "  Proyecto Demo  ",
      ubicacion: "  Lima  "
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        cliente: undefined,
        nombre: "Proyecto Demo",
        ubicacion: "Lima"
      });
    }
  });

  it("crea proyectos mediante la RPC transaccional", async () => {
    const client = createProjectRpcClient();

    const result = await createProject(client.client, scope, {
      cliente: "Cliente Demo",
      nombre: "Proyecto Demo",
      ubicacion: "Lima"
    });

    expect(result.ok).toBe(true);
    expect(client.rpcCalls).toEqual([
      {
        args: {
          cliente: "Cliente Demo",
          nombre_proyecto: "Proyecto Demo",
          p_organizacion_id: "org-1",
          ubicacion: "Lima"
        },
        name: "create_project_in_organization"
      }
    ]);
    if (result.ok) {
      expect(result.data).toMatchObject({
        cliente: "Cliente Demo",
        id: "project-1",
        nombre: "Proyecto Demo"
      });
    }
  });
});

function createProjectRpcClient() {
  const rpcCalls: Array<{ args: unknown; name: string }> = [];

  return {
    client: {
      rpc(name: string, args: unknown) {
        rpcCalls.push({ args, name });

        return Promise.resolve({
          data: {
            cliente: "Cliente Demo",
            codigo: null,
            created_at: "2026-05-01",
            created_by: "user-1",
            descripcion: null,
            estado: "activo",
            id: "project-1",
            nombre: "Proyecto Demo",
            organizacion_id: "org-1",
            ubicacion: "Lima",
            updated_at: "2026-05-01"
          },
          error: null
        });
      }
    } as unknown as DataClient,
    rpcCalls
  };
}
