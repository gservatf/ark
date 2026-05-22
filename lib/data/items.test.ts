import { describe, expect, it } from "vitest";

import {
  createPartida,
  createPartidaResource,
  deactivatePartida,
  deletePartidaResource,
  updatePartidaResource
} from "./items";
import type { DataClient } from "./types";
import { partidaApuResourceFormSchema, partidaInputSchema } from "../validations/items";
import type { Partida, PartidaRecurso, Recurso } from "../../types/domain";

const scope = {
  actorId: "user-1",
  organizacionId: "org-1"
};

describe("items repository", () => {
  it("coacciona numeros en partidas y recursos APU desde formularios", () => {
    const partida = partidaInputSchema.safeParse({
      codigo: "OE.01",
      estado: "activo",
      nombre: "Tarrajeo",
      rendimiento: "12.5",
      unidad: "m2"
    });
    const resource = partidaApuResourceFormSchema.safeParse({
      cantidad: "2",
      desperdicio_porcentaje: "10",
      grupo: "materiales",
      partida_id: "part-1",
      recurso_id: "rec-1",
      rendimiento_factor: "1.5"
    });

    expect(partida.success).toBe(true);
    expect(resource.success).toBe(true);
    if (partida.success) {
      expect(partida.data.rendimiento).toBe(12.5);
    }
    if (resource.success) {
      expect(resource.data.cantidad).toBe(2);
      expect(resource.data.desperdicio_porcentaje).toBe(10);
      expect(resource.data.rendimiento_factor).toBe(1.5);
    }
  });

  it("rechaza rendimiento y factor de rendimiento en cero", () => {
    const partida = partidaInputSchema.safeParse({
      codigo: "OE.01",
      estado: "activo",
      nombre: "Tarrajeo",
      rendimiento: "0",
      unidad: "m2"
    });
    const resource = partidaApuResourceFormSchema.safeParse({
      cantidad: "2",
      desperdicio_porcentaje: "10",
      grupo: "materiales",
      partida_id: "part-1",
      recurso_id: "rec-1",
      rendimiento_factor: "0"
    });
    const emptyValues = partidaApuResourceFormSchema.safeParse({
      cantidad: "2",
      desperdicio_porcentaje: "10",
      grupo: "materiales",
      partida_id: "part-1",
      recurso_id: "rec-1",
      rendimiento_factor: ""
    });

    expect(partida.success).toBe(false);
    expect(resource.success).toBe(false);
    expect(emptyValues.success).toBe(true);
    if (emptyValues.success) {
      expect(emptyValues.data.rendimiento_factor).toBeNull();
    }
  });

  it("crea partidas con organizacion y auditoria", async () => {
    const client = createItemsClient();

    const result = await createPartida(client.client, scope, {
      categoria: "Arquitectura",
      codigo: "ARQ.01",
      estado: "activo",
      nombre: "Muro de ladrillo",
      unidad: "m2"
    });

    expect(result.ok).toBe(true);
    expect(client.inserts.partidas).toEqual([
      expect.objectContaining({
        codigo: "ARQ.01",
        nombre: "Muro de ladrillo",
        organizacion_id: "org-1"
      })
    ]);
    expect(client.inserts.activity_events).toEqual([
      expect.objectContaining({
        action: "create",
        actor_id: "user-1",
        entity_type: "partida",
        organizacion_id: "org-1"
      })
    ]);
  });

  it("calcula parcial y audita al crear recursos APU", async () => {
    const client = createItemsClient({
      existingResources: []
    });

    const result = await createPartidaResource(client.client, scope, {
      cantidad: 2,
      desperdicio_porcentaje: 10,
      grupo: "materiales",
      partida_id: "part-1",
      recurso_id: "rec-1",
      rendimiento_factor: 1.5
    });

    expect(result.ok).toBe(true);
    expect(client.inserts.partida_recursos).toEqual([
      expect.objectContaining({
        costo_transporte_snapshot: 5,
        costo_unitario_snapshot: 50,
        orden: 1,
        parcial: 120,
        unidad: "bol"
      })
    ]);
    expect(client.inserts.activity_events).toEqual([
      expect.objectContaining({
        action: "create",
        entity_type: "partida_recurso"
      })
    ]);
  });

  it("recalcula parcial y audita al editar recursos APU", async () => {
    const currentResource = createPartidaResourceRow({
      cantidad: 1,
      desperdicio_porcentaje: 0,
      parcial: 55
    });
    const client = createItemsClient({ currentPartidaResource: currentResource });

    const result = await updatePartidaResource(client.client, scope, currentResource.id, {
      cantidad: 3,
      desperdicio_porcentaje: 0,
      grupo: "materiales",
      rendimiento_factor: 1
    });

    expect(result.ok).toBe(true);
    expect(client.updates.partida_recursos).toEqual([
      expect.objectContaining({
        cantidad: 3,
        parcial: 165
      })
    ]);
    expect(client.inserts.activity_events).toEqual([
      expect.objectContaining({
        action: "update",
        entity_type: "partida_recurso"
      })
    ]);
  });

  it("desactiva partidas y elimina relaciones APU con auditoria", async () => {
    const currentPartida = createPartidaRow({ estado: "activo" });
    const inactivePartida = createPartidaRow({ estado: "inactivo" });
    const currentPartidaResource = createPartidaResourceRow();
    const client = createItemsClient({
      currentPartida,
      currentPartidaResource,
      updatedPartida: inactivePartida
    });

    const deactivateResult = await deactivatePartida(client.client, scope, currentPartida.id);
    const deleteResult = await deletePartidaResource(client.client, scope, currentPartidaResource.id);

    expect(deactivateResult.ok).toBe(true);
    expect(deleteResult.ok).toBe(true);
    expect(client.updates.partidas).toEqual([{ estado: "inactivo" }]);
    expect(client.deletes.partida_recursos).toBe(1);
    expect(client.inserts.activity_events).toEqual([
      expect.objectContaining({ action: "update", entity_type: "partida" }),
      expect.objectContaining({ action: "delete", entity_type: "partida_recurso" })
    ]);
  });
});

function createItemsClient({
  currentPartida = createPartidaRow(),
  currentPartidaResource = createPartidaResourceRow(),
  existingResources = [createPartidaResourceRow()],
  resource = createResourceRow(),
  updatedPartida = currentPartida,
  updatedPartidaResource
}: {
  currentPartida?: Partida;
  currentPartidaResource?: PartidaRecurso;
  existingResources?: PartidaRecurso[];
  resource?: Recurso;
  updatedPartida?: Partida;
  updatedPartidaResource?: PartidaRecurso;
} = {}) {
  const inserts: Record<string, unknown[]> = {
    activity_events: [],
    partida_recursos: [],
    partidas: []
  };
  const updates: Record<string, unknown[]> = {
    partida_recursos: [],
    partidas: []
  };
  const deletes = {
    partida_recursos: 0
  };

  return {
    client: {
      from(table: string) {
        const state: { operation?: "delete" | "insert" | "update"; payload?: unknown } = {};
        const chain = {
          delete() {
            state.operation = "delete";
            deletes.partida_recursos += table === "partida_recursos" ? 1 : 0;
            return chain;
          },
          eq() {
            return chain;
          },
          insert(payload: unknown) {
            state.operation = "insert";
            state.payload = payload;
            if (table in inserts) {
              inserts[table].push(payload);
            }
            return chain;
          },
          maybeSingle() {
            if (table === "partidas" && state.operation === "update") {
              return Promise.resolve({ data: updatedPartida, error: null });
            }

            if (table === "partidas") {
              return Promise.resolve({ data: currentPartida, error: null });
            }

            if (table === "recursos") {
              return Promise.resolve({ data: resource, error: null });
            }

            if (table === "partida_recursos" && state.operation === "update") {
              return Promise.resolve({
                data: updatedPartidaResource || createPartidaResourceRow(state.payload as Partial<PartidaRecurso>),
                error: null
              });
            }

            if (table === "partida_recursos" && state.operation === "delete") {
              return Promise.resolve({ data: currentPartidaResource, error: null });
            }

            if (table === "partida_recursos") {
              return Promise.resolve({
                data: { ...currentPartidaResource, partida: { organizacion_id: "org-1" } },
                error: null
              });
            }

            return Promise.resolve({ data: null, error: null });
          },
          order() {
            if (table === "partida_recursos") {
              return Promise.resolve({ data: existingResources, error: null });
            }

            return chain;
          },
          select() {
            return chain;
          },
          single() {
            if (table === "partidas") {
              return Promise.resolve({
                data: createPartidaRow(state.payload as Partial<Partida>),
                error: null
              });
            }

            if (table === "partida_recursos") {
              return Promise.resolve({
                data: createPartidaResourceRow(state.payload as Partial<PartidaRecurso>),
                error: null
              });
            }

            return Promise.resolve({ data: state.payload, error: null });
          },
          then(resolve: (value: { error: null }) => unknown) {
            return Promise.resolve({ error: null }).then(resolve);
          },
          update(payload: unknown) {
            state.operation = "update";
            state.payload = payload;
            if (table in updates) {
              updates[table].push(payload);
            }
            return chain;
          }
        };

        return chain;
      }
    } as unknown as DataClient,
    deletes,
    inserts,
    updates
  };
}

function createPartidaRow(overrides: Partial<Partida> = {}): Partida {
  return {
    categoria: null,
    codigo: "ARQ.01",
    created_at: "2026-05-01",
    cuadrilla: null,
    descripcion: null,
    especificaciones: null,
    estado: "activo",
    id: "part-1",
    nombre: "Muro de ladrillo",
    organizacion_id: "org-1",
    rendimiento: null,
    unidad: "m2",
    updated_at: "2026-05-01",
    ...overrides
  };
}

function createPartidaResourceRow(overrides: Partial<PartidaRecurso> = {}): PartidaRecurso {
  return {
    cantidad: 1,
    costo_transporte_snapshot: 5,
    costo_unitario_snapshot: 50,
    desperdicio_porcentaje: 0,
    grupo: "materiales",
    id: "apu-1",
    orden: 1,
    parcial: 55,
    partida_id: "part-1",
    recurso_id: "rec-1",
    rendimiento_factor: 1,
    unidad: "bol",
    ...overrides
  };
}

function createResourceRow(overrides: Partial<Recurso> = {}): Recurso {
  return {
    costo_transporte: 5,
    costo_unitario_actual: 50,
    created_at: "2026-05-01",
    especificacion: null,
    estado: "activo",
    fecha_actualizacion_precio: null,
    fuente_precio: null,
    id: "rec-1",
    marca: null,
    nombre: "Cemento",
    organizacion_id: "org-1",
    proveedor_id: null,
    tipo: "material",
    transporte_aplica: true,
    unidad: "bol",
    updated_at: "2026-05-01",
    ...overrides
  };
}
