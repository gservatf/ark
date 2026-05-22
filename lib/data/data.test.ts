import { afterEach, describe, expect, it, vi } from "vitest";

import { createProvider, deactivateProvider, updateProvider } from "./providers";
import {
  canAutoUpdateDraftResourcePrice,
  createResource,
  createResourceCatalogPriceChange,
  deactivateResource,
  updateResource
} from "./resources";
import { recursoInputSchema } from "../validations/resources";
import { budgetDraftUpdateSchema } from "../validations/budgets";
import { optionalRucSchema } from "../validations/shared";
import { getChangedFields } from "./audit";
import { getConflictFieldLabels, isOptimisticConflict, optimisticConflictError } from "./conflicts";
import { normalizeSupabaseError } from "./errors";
import { validateDataScope } from "./scope";
import type { DataClient } from "./types";
import type { Proveedor, Recurso } from "../../types/domain";

const scope = {
  actorId: "user-1",
  organizacionId: "org-1",
  proyectoId: "project-1"
};

describe("data contracts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normaliza errores conocidos de Supabase", () => {
    expect(normalizeSupabaseError({ code: "42501", message: "forbidden" }).code).toBe(
      "permission"
    );
    expect(normalizeSupabaseError({ code: "23505", message: "duplicate" }).code).toBe(
      "conflict"
    );
    expect(normalizeSupabaseError({ code: "PGRST116", message: "missing" }).code).toBe(
      "not_found"
    );
  });

  it("sanitiza detalles crudos de Supabase en produccion", () => {
    vi.stubEnv("NODE_ENV", "production");

    const result = normalizeSupabaseError({
      code: "XX000",
      details: "select secret from private.table",
      message: "internal sql detail"
    });

    expect(result.message).toBe("No se pudo completar la operación solicitada.");
    expect(result.details).toEqual({ code: "XX000" });
  });

  it("mantiene detalles de conflictos optimistas para resolver sobrescrituras", () => {
    vi.stubEnv("NODE_ENV", "production");
    const error = optimisticConflictError({
      attempted: { nombre: "Arena local" },
      base: { id: "rec-1", nombre: "Arena", updated_at: "2026-05-01" },
      entityLabel: "El recurso",
      expectedUpdatedAt: "2026-05-01",
      persisted: { id: "rec-1", nombre: "Arena remota", updated_at: "2026-05-02" },
      source: "recursos.update"
    });

    expect(isOptimisticConflict(error)).toBe(true);
    if (isOptimisticConflict(error)) {
      expect((error.details.persisted as { updated_at: string }).updated_at).toBe("2026-05-02");
    }
  });


  it("rechaza scope sin organizacion", () => {
    const result = validateDataScope({ organizacionId: "" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("validation");
    }
  });

  it("rechaza mutaciones auditadas sin actor", async () => {
    const result = await createProvider(createEmptyClient(), { organizacionId: "org-1" }, {
      nombre: "Proveedor Demo"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("validation");
    }
  });

  it("valida inputs de proveedor y recurso antes de tocar Supabase", async () => {
    const providerResult = await createProvider(createEmptyClient(), scope, {
      nombre: "",
      ruc: "123"
    });
    const resourceResult = await createResource(createEmptyClient(), scope, {
      costo_transporte: 0,
      costo_unitario_actual: -1,
      estado: "activo",
      nombre: "",
      tipo: "material",
      transporte_aplica: false,
      unidad: ""
    });

    expect(providerResult.ok).toBe(false);
    expect(resourceResult.ok).toBe(false);
    if (!providerResult.ok) {
      expect(providerResult.error.code).toBe("validation");
    }
    if (!resourceResult.ok) {
      expect(resourceResult.error.code).toBe("validation");
    }
  });

  it("detecta campos modificados para auditoria", () => {
    const changes = getChangedFields(
      { nombre: "Arena", costo_unitario_actual: 80, updated_at: "2026-05-01" },
      { nombre: "Arena fina", costo_unitario_actual: 80, updated_at: "2026-05-02" }
    );

    expect(Object.keys(changes)).toEqual(["nombre"]);
    expect(changes.nombre).toEqual({ after: "Arena fina", before: "Arena" });
  });

  it("describe conflictos optimistas con campos persistidos cambiados", () => {
    const error = optimisticConflictError({
      attempted: { nombre: "Arena local" },
      base: { id: "rec-1", nombre: "Arena", updated_at: "2026-05-01" },
      entityLabel: "El recurso",
      expectedUpdatedAt: "2026-05-01",
      persisted: { id: "rec-1", nombre: "Arena remota", updated_at: "2026-05-02" },
      source: "recursos.update"
    });

    expect(isOptimisticConflict(error)).toBe(true);
    expect(getConflictFieldLabels(error)).toContain("nombre");
    expect(error.message).toContain("cambio mientras estabas editando");
  });

  it("coacciona costos numericos en recursos desde formularios", () => {
    const parsed = recursoInputSchema.safeParse({
      costo_transporte: "4.25",
      costo_unitario_actual: "42.50",
      estado: "activo",
      nombre: "Porcelanato",
      tipo: "material",
      transporte_aplica: true,
      unidad: "m2"
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.costo_unitario_actual).toBe(42.5);
      expect(parsed.data.costo_transporte).toBe(4.25);
    }
  });

  it("limita strings obligatorios para evitar payloads excesivos", () => {
    const parsed = recursoInputSchema.safeParse({
      costo_transporte: "4.25",
      costo_unitario_actual: "42.50",
      estado: "activo",
      nombre: "x".repeat(256),
      tipo: "material",
      transporte_aplica: true,
      unidad: "m2"
    });

    expect(parsed.success).toBe(false);
  });

  it("valida RUC opcional y porcentajes de borrador", () => {
    expect(optionalRucSchema.safeParse("").success).toBe(true);
    expect(optionalRucSchema.safeParse("20123456789").success).toBe(true);
    expect(optionalRucSchema.safeParse("123").success).toBe(false);
    expect(budgetDraftUpdateSchema.safeParse({ igv_porcentaje: 101 }).success).toBe(false);
    expect(budgetDraftUpdateSchema.safeParse({ utilidad_porcentaje: 0 }).success).toBe(true);
  });

  it("crea proveedores con organizacion y auditoria", async () => {
    const client = createProviderCreateClient();

    const result = await createProvider(client.client, scope, {
      email: "ventas@demo.pe",
      nombre: "Proveedor Demo",
      ruc: "20123456789"
    });

    expect(result.ok).toBe(true);
    expect(client.inserts.proveedores).toEqual([
      expect.objectContaining({
        email: "ventas@demo.pe",
        disponible_para_cliente: false,
        nombre: "Proveedor Demo",
        organizacion_id: "org-1",
        ruc: "20123456789"
      })
    ]);
    expect(client.inserts.activity_events).toEqual([
      expect.objectContaining({
        action: "create",
        actor_id: "user-1",
        entity_type: "proveedor",
        organizacion_id: "org-1",
        proyecto_id: "project-1"
      })
    ]);
  });

  it("crea recursos con organizacion y auditoria", async () => {
    const client = createResourceCreateClient();

    const result = await createResource(client.client, scope, {
      costo_transporte: 2.5,
      costo_unitario_actual: 32,
      estado: "activo",
      fecha_actualizacion_precio: "2026-05-19",
      fuente_precio: "Lista mayo",
      nombre: "Cemento",
      tipo: "material",
      transporte_aplica: true,
      unidad: "bol"
    });

    expect(result.ok).toBe(true);
    expect(client.inserts.recursos).toEqual([
      expect.objectContaining({
        costo_transporte: 2.5,
        costo_unitario_actual: 32,
        nombre: "Cemento",
        organizacion_id: "org-1"
      })
    ]);
    expect(client.inserts.activity_events).toEqual([
      expect.objectContaining({
        action: "create",
        actor_id: "user-1",
        entity_type: "recurso",
        organizacion_id: "org-1"
      })
    ]);
  });

  it("no registra historial de precios si el costo no cambia", async () => {
    const before = createResourceRow({
      costo_transporte: 2,
      costo_unitario_actual: 30
    });
    const after = createResourceRow({
      costo_transporte: 2,
      costo_unitario_actual: 30,
      nombre: "Cemento actualizado"
    });
    const client = createResourceUpdateClient(before, after);

    const result = await updateResource(client.client, scope, before.id, {
      nombre: "Cemento actualizado"
    });

    expect(result.ok).toBe(true);
    expect(client.inserts.recurso_precios_historial).toEqual([]);
    expect(client.inserts.activity_events).toEqual([
      expect.objectContaining({
        action: "update",
        entity_type: "recurso"
      })
    ]);
  });

  it("actualiza proveedores y registra auditoria", async () => {
    const before = createProviderRow({ nombre: "Proveedor Demo" });
    const after = createProviderRow({ nombre: "Proveedor Demo Editado" });
    const client = createProviderMutationClient(before, after);

    const result = await updateProvider(client.client, scope, before.id, {
      nombre: "Proveedor Demo Editado"
    });

    expect(result.ok).toBe(true);
    expect(client.updates.proveedores).toEqual([{ nombre: "Proveedor Demo Editado" }]);
    expect(client.inserts.activity_events).toEqual([
      expect.objectContaining({
        action: "update",
        actor_id: "user-1",
        entity_id: before.id,
        entity_type: "proveedor",
        organizacion_id: "org-1"
      })
    ]);
  });

  it("desactiva proveedores y registra auditoria", async () => {
    const before = createProviderRow({ estado: "activo" });
    const after = createProviderRow({ estado: "inactivo" });
    const client = createProviderMutationClient(before, after);

    const result = await deactivateProvider(client.client, scope, before.id);

    expect(result.ok).toBe(true);
    expect(client.updates.proveedores).toEqual([{ estado: "inactivo" }]);
    expect(client.inserts.activity_events).toEqual([
      expect.objectContaining({
        action: "deactivate",
        actor_id: "user-1",
        entity_id: before.id,
        entity_type: "proveedor",
        organizacion_id: "org-1"
      })
    ]);
  });

  it("registra historial de precios cuando cambia costo o transporte", async () => {
    const before = createResourceRow({
      costo_transporte: 2,
      costo_unitario_actual: 30,
      fecha_actualizacion_precio: "2026-05-01",
      fuente_precio: "Lista abril"
    });
    const after = createResourceRow({
      costo_transporte: 3,
      costo_unitario_actual: 32,
      fecha_actualizacion_precio: "2026-05-19",
      fuente_precio: "Lista mayo"
    });
    const client = createResourceUpdateClient(before, after);

    const result = await updateResource(client.client, scope, before.id, {
      costo_transporte: 3,
      costo_unitario_actual: 32,
      fecha_actualizacion_precio: "2026-05-19",
      fuente_precio: "Lista mayo"
    });

    expect(result.ok).toBe(true);
    expect(client.inserts.recurso_precios_historial).toEqual([
      expect.objectContaining({
        costo_transporte_anterior: 2,
        costo_transporte_nuevo: 3,
        costo_unitario_anterior: 30,
        costo_unitario_nuevo: 32,
        fecha: "2026-05-19",
        recurso_id: before.id,
        usuario_id: "user-1"
      })
    ]);
    expect(client.rpcCalls).toEqual([
      {
        args: {
          p_resource_ids: [before.id]
        },
        name: "refresh_draft_current_prices_for_resources"
      }
    ]);
    expect(client.inserts.activity_events).toEqual([
      expect.objectContaining({
        action: "update",
        actor_id: "user-1",
        entity_id: before.id,
        entity_type: "recurso",
        organizacion_id: "org-1",
        proyecto_id: "project-1"
      })
    ]);
  });

  it("desactiva recursos y registra auditoria", async () => {
    const before = createResourceRow({ estado: "activo" });
    const after = createResourceRow({ estado: "inactivo" });
    const client = createResourceUpdateClient(before, after);

    const result = await deactivateResource(client.client, scope, before.id);

    expect(result.ok).toBe(true);
    expect(client.inserts.activity_events).toEqual([
      expect.objectContaining({
        action: "deactivate",
        actor_id: "user-1",
        entity_id: before.id,
        entity_type: "recurso",
        organizacion_id: "org-1"
      })
    ]);
  });

  it("prepara contrato para autoactualizar solo borradores de catalogo sin precio fijado", () => {
    const before = createResourceRow({
      costo_transporte: 2,
      costo_unitario_actual: 30
    });
    const after = createResourceRow({
      costo_transporte: 3,
      costo_unitario_actual: 32
    });
    const priceChange = createResourceCatalogPriceChange(before, after);

    expect(priceChange).not.toBeNull();
    expect(
      priceChange &&
        canAutoUpdateDraftResourcePrice(
          {
            autoactualizar_precio: true,
            precio_fijado: false,
            precio_origen: "catalogo",
            recurso_id: before.id
          },
          priceChange
        )
    ).toBe(true);
    expect(
      priceChange &&
        canAutoUpdateDraftResourcePrice(
          {
            autoactualizar_precio: true,
            precio_fijado: true,
            precio_origen: "catalogo",
            recurso_id: before.id
          },
          priceChange
        )
    ).toBe(false);
  });
});

function createEmptyClient(): DataClient {
  return {
    from() {
      throw new Error("Supabase no debio ser llamado en este caso.");
    }
  } as unknown as DataClient;
}

function createResourceUpdateClient(before: Recurso, after: Recurso) {
  const inserts: Record<string, unknown[]> = {
    activity_events: [],
    recurso_precios_historial: []
  };
  const rpcCalls: Array<{ args: unknown; name: string }> = [];
  let resourceReadCount = 0;

  return {
    client: {
      rpc(name: string, args: unknown) {
        rpcCalls.push({ args, name });
        return Promise.resolve({ data: { refreshedDrafts: 1 }, error: null });
      },
      from(table: string) {
        const state: { operation?: "insert" | "update"; payload?: unknown } = {};
        const chain = {
          delete() {
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
          in() {
            return chain;
          },
          maybeSingle() {
            if (table === "recursos" && state.operation === "update") {
              return Promise.resolve({ data: after, error: null });
            }

            if (table === "recursos") {
              resourceReadCount += 1;
              return Promise.resolve({ data: resourceReadCount === 1 ? before : after, error: null });
            }

            return Promise.resolve({ data: null, error: null });
          },
          order() {
            return chain;
          },
          select() {
            return chain;
          },
          single() {
            return Promise.resolve({ data: state.payload, error: null });
          },
          then(resolve: (value: { error: null }) => unknown) {
            return Promise.resolve({ error: null }).then(resolve);
          },
          update(payload: unknown) {
            state.operation = "update";
            state.payload = payload;
            return chain;
          }
        };

        return chain;
      }
    } as unknown as DataClient,
    inserts,
    rpcCalls
  };
}

function createResourceCreateClient() {
  const inserts: Record<string, unknown[]> = {
    activity_events: [],
    recursos: []
  };

  return {
    client: {
      from(table: string) {
        const state: { payload?: unknown } = {};
        const chain = {
          insert(payload: unknown) {
            state.payload = payload;
            if (table in inserts) {
              inserts[table].push(payload);
            }
            return chain;
          },
          select() {
            return chain;
          },
          single() {
            return Promise.resolve({
              data: createResourceRow(state.payload as Partial<Recurso>),
              error: null
            });
          },
          then(resolve: (value: { error: null }) => unknown) {
            return Promise.resolve({ error: null }).then(resolve);
          }
        };

        return chain;
      }
    } as unknown as DataClient,
    inserts
  };
}

function createProviderCreateClient() {
  const inserts: Record<string, unknown[]> = {
    activity_events: [],
    proveedores: []
  };

  return {
    client: {
      from(table: string) {
        const state: { payload?: unknown } = {};
        const chain = {
          insert(payload: unknown) {
            state.payload = payload;
            if (table in inserts) {
              inserts[table].push(payload);
            }
            return chain;
          },
          select() {
            return chain;
          },
          single() {
            return Promise.resolve({
              data: createProviderRow(state.payload as Partial<Proveedor>),
              error: null
            });
          },
          then(resolve: (value: { error: null }) => unknown) {
            return Promise.resolve({ error: null }).then(resolve);
          }
        };

        return chain;
      }
    } as unknown as DataClient,
    inserts
  };
}

function createProviderMutationClient(
  before: Proveedor,
  after: Proveedor
) {
  const inserts: Record<string, unknown[]> = {
    activity_events: []
  };
  const updates: Record<string, unknown[]> = {
    proveedores: []
  };
  let providerReadCount = 0;

  return {
    client: {
      from(table: string) {
        const state: { operation?: "insert" | "update"; payload?: unknown } = {};
        const chain = {
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
            if (table === "proveedores" && state.operation === "update") {
              return Promise.resolve({ data: after, error: null });
            }

            if (table === "proveedores") {
              providerReadCount += 1;
              return Promise.resolve({ data: providerReadCount === 1 ? before : after, error: null });
            }

            return Promise.resolve({ data: null, error: null });
          },
          select() {
            return chain;
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
    inserts,
    updates
  };
}

function createProviderRow(overrides: Partial<Proveedor> = {}): Proveedor {
  return {
    contacto: null,
    created_at: "2026-05-01",
    direccion: null,
    disponible_para_cliente: false,
    email: null,
    estado: "activo" as const,
    id: "prov-1",
    nombre: "Proveedor Demo",
    notas: null,
    organizacion_id: "org-1",
    ruc: "20123456789",
    telefono: null,
    updated_at: "2026-05-01",
    ...overrides
  };
}

function createResourceRow(overrides: Partial<Recurso>): Recurso {
  return {
    costo_transporte: 0,
    costo_unitario_actual: 0,
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
