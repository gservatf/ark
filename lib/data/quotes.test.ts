import { describe, expect, it } from "vitest";

import {
  createResourceQuote,
  deactivateResourceQuote,
  listResourceQuotes,
  updateResourceQuote
} from "./quotes";
import type { DataClient } from "./types";
import type { Proveedor, RecursoProveedorPrecio } from "../../types/domain";

const scope = {
  actorId: "user-1",
  organizacionId: "org-1",
  proyectoId: "project-1"
};

describe("quotes repository", () => {
  it("lista cotizaciones por recurso con proveedor y orden esperado", async () => {
    const quote = createQuote({ id: "quote-1" });
    const harness = createQuotesClient({ quotes: [quote] });

    const result = await listResourceQuotes(harness.client, scope, "resource-1");

    expect(result.ok).toBe(true);
    expect(harness.orders.recurso_proveedor_precios).toEqual([
      ["estado", { ascending: true }],
      ["es_preferido_interno", { ascending: false }],
      ["fecha_cotizacion", { ascending: false, nullsFirst: false }]
    ]);
    if (result.ok) {
      expect(result.data).toEqual([quote]);
    }
  });

  it("crea cotizacion preferida, limpia preferida anterior, audita y refresca borradores", async () => {
    const harness = createQuotesClient();

    const result = await createResourceQuote(harness.client, scope, {
      costo_transporte: 2.5,
      costo_unitario: 30,
      es_preferido_interno: true,
      estado: "activo",
      moneda: "PEN",
      proveedor_id: "provider-1",
      recurso_id: "resource-1",
      vigente_desde: "2026-05-01",
      vigente_hasta: "2026-05-31"
    });

    expect(result.ok).toBe(true);
    expect(harness.updates.recurso_proveedor_precios[0]).toEqual({
      es_preferido_interno: false
    });
    expect(harness.inserts.recurso_proveedor_precios[0]).toMatchObject({
      costo_transporte: 2.5,
      costo_unitario: 30,
      es_preferido_interno: true,
      organizacion_id: "org-1",
      proveedor_id: "provider-1",
      recurso_id: "resource-1"
    });
    expect(harness.inserts.activity_events[0]).toMatchObject({
      action: "create",
      actor_id: "user-1",
      entity_type: "recurso_proveedor_precio",
      organizacion_id: "org-1"
    });
    expect(harness.rpcCalls).toEqual([
      {
        args: { p_resource_ids: ["resource-1"] },
        name: "refresh_draft_current_prices_for_resources"
      }
    ]);
  });

  it("edita cotizacion con conflicto optimista y conserva detalle remoto", async () => {
    const before = createQuote({
      costo_unitario: 30,
      id: "quote-1",
      updated_at: "2026-05-20T10:00:00.000Z"
    });
    const latest = createQuote({
      costo_unitario: 34,
      id: "quote-1",
      updated_at: "2026-05-20T10:05:00.000Z"
    });
    const harness = createQuotesClient({ conflictOnUpdate: true, currentQuote: before, latestQuote: latest });

    const result = await updateResourceQuote(
      harness.client,
      scope,
      "quote-1",
      { costo_unitario: 32 },
      { expectedUpdatedAt: "2026-05-20T10:00:00.000Z" }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("conflict");
      expect(result.error.details).toMatchObject({
        entityId: "quote-1",
        expectedUpdatedAt: "2026-05-20T10:00:00.000Z",
        persisted: expect.objectContaining({ costo_unitario: 34 })
      });
    }
    expect(harness.inserts.activity_events).toEqual([]);
    expect(harness.rpcCalls).toEqual([]);
  });

  it("edita cotizacion preferida, audita y refresca el recurso afectado", async () => {
    const before = createQuote({ es_preferido_interno: false });
    const after = createQuote({ costo_unitario: 35, es_preferido_interno: true });
    const harness = createQuotesClient({ currentQuote: before, updatedQuote: after });

    const result = await updateResourceQuote(harness.client, scope, before.id, {
      costo_unitario: 35,
      es_preferido_interno: true
    });

    expect(result.ok).toBe(true);
    expect(harness.updates.recurso_proveedor_precios).toEqual([
      { es_preferido_interno: false },
      { costo_unitario: 35, es_preferido_interno: true }
    ]);
    expect(harness.inserts.activity_events[0]).toMatchObject({
      action: "update",
      entity_id: before.id,
      entity_type: "recurso_proveedor_precio"
    });
    expect(harness.rpcCalls).toEqual([
      {
        args: { p_resource_ids: ["resource-1"] },
        name: "refresh_draft_current_prices_for_resources"
      }
    ]);
  });

  it("desactiva cotizacion limpiando preferencia interna y auditando", async () => {
    const before = createQuote({ es_preferido_interno: true, estado: "activo" });
    const after = createQuote({ es_preferido_interno: false, estado: "inactivo" });
    const harness = createQuotesClient({ currentQuote: before, updatedQuote: after });

    const result = await deactivateResourceQuote(harness.client, scope, before.id);

    expect(result.ok).toBe(true);
    expect(harness.updates.recurso_proveedor_precios[0]).toEqual({
      es_preferido_interno: false,
      estado: "inactivo"
    });
    expect(harness.inserts.activity_events[0]).toMatchObject({
      action: "update",
      entity_id: before.id,
      entity_type: "recurso_proveedor_precio"
    });
  });

  it("rechaza cotizaciones invalidas antes de tocar Supabase", async () => {
    const harness = createQuotesClient();

    const result = await createResourceQuote(harness.client, scope, {
      costo_transporte: 0,
      costo_unitario: -1,
      es_preferido_interno: false,
      estado: "activo",
      moneda: "PEN",
      proveedor_id: "",
      recurso_id: ""
    });

    expect(result.ok).toBe(false);
    expect(harness.inserts.recurso_proveedor_precios).toEqual([]);
    expect(harness.updates.recurso_proveedor_precios).toEqual([]);
    if (!result.ok) {
      expect(result.error.code).toBe("validation");
    }
  });
});

function createQuotesClient({
  conflictOnUpdate = false,
  currentQuote = createQuote(),
  latestQuote = currentQuote,
  quotes = [],
  updatedQuote
}: {
  conflictOnUpdate?: boolean;
  currentQuote?: RecursoProveedorPrecio;
  latestQuote?: RecursoProveedorPrecio;
  quotes?: RecursoProveedorPrecio[];
  updatedQuote?: RecursoProveedorPrecio;
} = {}) {
  const inserts: Record<string, unknown[]> = {
    activity_events: [],
    recurso_proveedor_precios: []
  };
  const updates: Record<string, unknown[]> = {
    recurso_proveedor_precios: []
  };
  const orders: Record<string, Array<[string, unknown]>> = {
    recurso_proveedor_precios: []
  };
  const rpcCalls: Array<{ args: unknown; name: string }> = [];
  let quoteReadCount = 0;

  const client = {
    rpc(name: string, args: unknown) {
      rpcCalls.push({ args, name });
      return Promise.resolve({ data: { refreshedDrafts: 1 }, error: null });
    },
    from(table: string) {
      const state: { operation?: "insert" | "update"; payload?: unknown } = {};
      const chain = {
        eq() {
          return chain;
        },
        in() {
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
          if (table === "recurso_proveedor_precios" && state.operation === "update") {
            return Promise.resolve({
              data: conflictOnUpdate ? null : updatedQuote || createQuote(state.payload as Partial<RecursoProveedorPrecio>),
              error: null
            });
          }

          if (table === "recurso_proveedor_precios") {
            quoteReadCount += 1;
            return Promise.resolve({
              data: quoteReadCount === 1 ? currentQuote : latestQuote,
              error: null
            });
          }

          return Promise.resolve({ data: null, error: null });
        },
        neq() {
          return chain;
        },
        order(column: string, options: unknown) {
          if (table in orders) {
            orders[table].push([column, options]);
          }

          return chain;
        },
        select() {
          return chain;
        },
        single() {
          return Promise.resolve({
            data: createQuote(state.payload as Partial<RecursoProveedorPrecio>),
            error: null
          });
        },
        then(resolve: (value: { data?: RecursoProveedorPrecio[]; error: null }) => unknown) {
          const value = state.operation
            ? { error: null }
            : { data: quotes, error: null };

          return Promise.resolve(value).then(resolve);
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
  } as unknown as DataClient;

  return {
    client,
    inserts,
    orders,
    rpcCalls,
    updates
  };
}

function createQuote(overrides: Partial<RecursoProveedorPrecio> = {}): RecursoProveedorPrecio {
  return {
    costo_transporte: 0,
    costo_unitario: 30,
    created_at: "2026-05-20T09:00:00.000Z",
    es_preferido_interno: false,
    estado: "activo",
    fecha_cotizacion: "2026-05-20",
    fuente_precio: "Lista mayo",
    id: "quote-1",
    moneda: "PEN",
    organizacion_id: "org-1",
    proveedor: createProvider(),
    proveedor_id: "provider-1",
    recurso_id: "resource-1",
    updated_at: "2026-05-20T10:00:00.000Z",
    url_referencia: null,
    vigente_desde: null,
    vigente_hasta: null,
    ...overrides
  };
}

function createProvider(overrides: Partial<Proveedor> = {}): Proveedor {
  return {
    contacto: null,
    created_at: "2026-05-20T09:00:00.000Z",
    direccion: null,
    disponible_para_cliente: true,
    email: null,
    estado: "activo",
    id: "provider-1",
    nombre: "Proveedor Demo",
    notas: null,
    organizacion_id: "org-1",
    ruc: null,
    telefono: null,
    updated_at: "2026-05-20T10:00:00.000Z",
    ...overrides
  };
}
