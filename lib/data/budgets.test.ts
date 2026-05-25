import { describe, expect, it } from "vitest";

import {
  addDraftPartida,
  buildOfficialBudgetVersionName,
  emitOfficialBudgetVersion,
  getOfficialBudgetVersion,
  listBudgetDashboardProjects,
  overrideDraftClientPrice,
  refreshDraftCurrentPrices,
  refreshDraftCurrentPricesForResources,
  removeDraftLine,
  selectDraftResourceClientQuote,
  setDraftLinePriceLock,
  setDraftResourcePriceLock,
  shouldAutoUpdateDraftResourcePrice,
  updateBudgetDraft,
  updateDraftLineMetrado
} from "./budgets";
import type {
  PresupuestoBorrador,
  PresupuestoBorradorPartida,
  PresupuestoBorradorPartidaRecurso,
  PresupuestoVersion,
  PresupuestoVersionPartidaRecurso,
  RecursoProveedorPrecio
} from "@/types/domain";
import type { DataClient } from "./types";

describe("budgetsRepository helpers", () => {
  it("construye nombres oficiales sin duplicar el sufijo presupuesto", () => {
    expect(buildOfficialBudgetVersionName("Edificio Los Olivos_Presupuesto", 1)).toBe(
      "Edificio Los Olivos_Presupuesto_V1"
    );
    expect(buildOfficialBudgetVersionName("Edificio Los Olivos", 2)).toBe(
      "Edificio Los Olivos_Presupuesto_V2"
    );
  });

  it("autoactualiza solo recursos catalogo no fijados dentro de lineas no fijadas", () => {
    expect(
      shouldAutoUpdateDraftResourcePrice(
        { precio_fijado: false },
        { autoactualizar_precio: true, precio_fijado: false, precio_origen: "catalogo" }
      )
    ).toBe(true);
    expect(
      shouldAutoUpdateDraftResourcePrice(
        { precio_fijado: true },
        { autoactualizar_precio: true, precio_fijado: false, precio_origen: "catalogo" }
      )
    ).toBe(false);
    expect(
      shouldAutoUpdateDraftResourcePrice(
        { precio_fijado: false },
        { autoactualizar_precio: true, precio_fijado: true, precio_origen: "catalogo" }
      )
    ).toBe(false);
    expect(
      shouldAutoUpdateDraftResourcePrice(
        { precio_fijado: false },
        { autoactualizar_precio: true, precio_fijado: false, precio_origen: "manual" }
      )
    ).toBe(false);
  });

  it("emite una version oficial mediante RPC transaccional", async () => {
    const harness = createBudgetRpcClient({
      rpcData: {
        lines: [createVersionLine()],
        resources: [],
        version: createVersion()
      }
    });

    const result = await emitOfficialBudgetVersion(
      harness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      "draft-1"
    );

    expect(result.ok).toBe(true);
    expect(harness.rpcCalls).toEqual([
      {
        args: {
          p_draft_id: "draft-1",
          p_expected_updated_at: "2026-05-20T10:00:00.000Z"
        },
        name: "emit_official_budget_version"
      }
    ]);
    if (result.ok) {
      expect(result.data.version.id).toBe("version-1");
    }
  });

  it("mapea conflicto stale de la RPC de emision", async () => {
    const harness = createBudgetRpcClient({
      rpcError: {
        message: "CYP_CONFLICT: El borrador cambio mientras estabas editando."
      }
    });

    const result = await emitOfficialBudgetVersion(
      harness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      "draft-1"
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("conflict");
      expect(result.error.message).toContain("cambio");
    }
  });

  it("rechaza emitir versiones oficiales de borradores vacios o ajenos al proyecto activo", async () => {
    const emptyHarness = createBudgetRpcClient({ lines: [] });

    const emptyResult = await emitOfficialBudgetVersion(
      emptyHarness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      "draft-1"
    );

    expect(emptyResult.ok).toBe(false);
    expect(emptyHarness.rpcCalls).toEqual([]);
    if (!emptyResult.ok) {
      expect(emptyResult.error.code).toBe("validation");
      expect(emptyResult.error.message).toContain("vacio");
    }

    const otherDraftHarness = createBudgetRpcClient({
      draft: createDraft({ id: "draft-other" })
    });
    const otherDraftResult = await emitOfficialBudgetVersion(
      otherDraftHarness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      "draft-1"
    );

    expect(otherDraftResult.ok).toBe(false);
    expect(otherDraftHarness.rpcCalls).toEqual([]);
    if (!otherDraftResult.ok) {
      expect(otherDraftResult.error.code).toBe("validation");
      expect(otherDraftResult.error.message).toContain("proyecto activo");
    }
  });

  it("lee version oficial congelada con lineas y recursos snapshot ordenados", async () => {
    const versionResource = createVersionResource({
      costo_unitario_snapshot: 41,
      precio_cliente_snapshot: 60,
      proveedor_nombre_snapshot: "Proveedor Interno SAC"
    });
    const harness = createBudgetRpcClient({
      officialResources: [versionResource],
      versions: [createVersion({ total: 143.6 })]
    });

    const result = await getOfficialBudgetVersion(
      harness.client,
      {
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      "version-1"
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.version.total).toBe(143.6);
      expect(result.data.lines).toEqual([expect.objectContaining({ id: "version-line-1" })]);
      expect(result.data.resources).toEqual([
        expect.objectContaining({
          costo_unitario_snapshot: 41,
          precio_cliente_snapshot: 60,
          proveedor_nombre_snapshot: "Proveedor Interno SAC"
        })
      ]);
    }
  });

  it("agrega partida mediante RPC y recarga el borrador activo", async () => {
    const harness = createBudgetRpcClient();

    const result = await addDraftPartida(
      harness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      "draft-1",
      "partida-2"
    );

    expect(result.ok).toBe(true);
    expect(harness.rpcCalls).toEqual([
      {
        args: {
          p_draft_id: "draft-1",
          p_partida_id: "partida-2"
        },
        name: "add_draft_partida"
      }
    ]);
  });

  it("lista proyectos de dashboard mediante RPC set-based", async () => {
    const dashboardProject = {
      cliente: null,
      estado: "borrador",
      gastoEjecutado: 0,
      gastoPorcentaje: 0,
      id: "project-1",
      partidasCompletadas: 0,
      partidasTotal: 1,
      proyecto_nombre: "Proyecto Demo",
      subtotal: 10,
      total: 11.8,
      ubicacion: null,
      updated_at: "2026-05-20T10:00:00.000Z",
      version: "Borrador"
    };
    const harness = createBudgetRpcClient({ rpcData: [dashboardProject] });

    const result = await listBudgetDashboardProjects(harness.client, {
      actorId: "user-1",
      organizacionId: "org-1"
    });

    expect(result.ok).toBe(true);
    expect(harness.rpcCalls).toEqual([
      { args: { p_organizacion_id: "org-1" }, name: "list_budget_dashboard_projects" }
    ]);
    if (result.ok) {
      expect(result.data).toEqual([dashboardProject]);
    }
  });

  it("refresca precios por RPC y recarga el borrador activo", async () => {
    const harness = createBudgetRpcClient();

    const result = await refreshDraftCurrentPrices(
      harness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      "draft-1"
    );

    expect(result.ok).toBe(true);
    expect(harness.rpcCalls[0]).toEqual({
      args: { p_draft_id: "draft-1" },
      name: "refresh_draft_current_prices"
    });
  });

  it("refresca precios de recursos en lote mediante RPC", async () => {
    const harness = createBudgetRpcClient({ rpcData: { refreshedDrafts: 2 } });

    const result = await refreshDraftCurrentPricesForResources(
      harness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1"
      },
      ["resource-1", "resource-1", "resource-2"]
    );

    expect(result.ok).toBe(true);
    expect(harness.rpcCalls).toEqual([
      {
        args: { p_resource_ids: ["resource-1", "resource-2"] },
        name: "refresh_draft_current_prices_for_resources"
      }
    ]);
  });

  it("actualiza borrador con allowlist y descarta keys extra", async () => {
    const harness = createBudgetRpcClient();

    const result = await updateBudgetDraft(
      harness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      "draft-1",
      {
        cliente: "Cliente ajustado",
        total: 999
      } as unknown as Partial<PresupuestoBorrador>
    );

    expect(result.ok).toBe(true);
    expect(harness.updates.presupuesto_borradores[0]).toEqual({
      cliente: "Cliente ajustado",
      updated_by: "user-1"
    });
  });

  it("actualiza metrado con redondeo, recalcula totales y audita la linea", async () => {
    const line = createLine({ metrado: 1, parcial: 0.1, precio_unitario_actual: 0.1 });
    const harness = createBudgetRpcClient({ lines: [line] });

    const result = await updateDraftLineMetrado(
      harness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      line,
      0.2
    );

    expect(result.ok).toBe(true);
    expect(harness.updates.presupuesto_borrador_partidas[0]).toEqual({
      metrado: 0.2,
      parcial: 0.02
    });
    expect(harness.rpcCalls[0]).toEqual({
      args: { p_draft_id: "draft-1" },
      name: "recalculate_budget_draft_totals"
    });
    expect(harness.inserts.activity_events[0]).toMatchObject({
      action: "update_metrado",
      entity_id: "line-1",
      entity_type: "presupuesto_borrador_partida"
    });
  });

  it("detecta conflicto optimista si el metrado fue editado remotamente", async () => {
    const line = createLine({ metrado: 1, updated_at: "2026-05-20T10:00:00.000Z" });
    const harness = createBudgetRpcClient({
      lineUpdateConflict: true,
      latestLineAfterUpdate: createLine({
        metrado: 3,
        updated_at: "2026-05-20T10:05:00.000Z"
      }),
      lines: [line]
    });

    const result = await updateDraftLineMetrado(
      harness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      line,
      2
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("conflict");
      expect(result.error.message).toContain("cambio");
      expect(result.error.details).toMatchObject({
        entityId: "line-1",
        expectedUpdatedAt: "2026-05-20T10:00:00.000Z"
      });
    }
  });

  it("elimina lineas con auditoria y recalculo transaccional", async () => {
    const line = createLine();
    const harness = createBudgetRpcClient({ lines: [line] });

    const result = await removeDraftLine(
      harness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      line
    );

    expect(result.ok).toBe(true);
    expect(harness.deletes.presupuesto_borrador_partidas).toBe(1);
    expect(harness.rpcCalls[0]).toEqual({
      args: { p_draft_id: "draft-1" },
      name: "recalculate_budget_draft_totals"
    });
    expect(harness.inserts.activity_events[0]).toMatchObject({
      action: "remove_partida",
      entity_id: "line-1",
      entity_type: "presupuesto_borrador_partida"
    });
  });

  it("fija y libera precios de lineas y recursos con flags correctos", async () => {
    const harness = createBudgetRpcClient();

    const fixedLine = await setDraftLinePriceLock(
      harness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      "line-1",
      { motivo_precio_fijado: "Contrato firmado", precio_fijado: true }
    );
    const unfixedResource = await setDraftResourcePriceLock(
      harness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      "draft-resource-1",
      { precio_fijado: false }
    );

    expect(fixedLine.ok).toBe(true);
    expect(unfixedResource.ok).toBe(true);
    expect(harness.updates.presupuesto_borrador_partidas[0]).toEqual({
      autoactualizar_precio: false,
      motivo_precio_fijado: "Contrato firmado",
      precio_fijado: true,
      precio_origen: "snapshot"
    });
    expect(harness.updates.presupuesto_borrador_partida_recursos[0]).toEqual({
      autoactualizar_precio: true,
      motivo_precio_fijado: null,
      precio_fijado: false,
      precio_origen: "catalogo"
    });
    expect(harness.inserts.activity_events).toEqual([
      expect.objectContaining({ action: "fix_line_price" }),
      expect.objectContaining({ action: "unfix_resource_price" })
    ]);
  });

  it("selecciona cotizacion cliente manual, actualiza campos precio_cliente y audita el cambio", async () => {
    const harness = createBudgetRpcClient({
      quote: createQuote({
        costo_transporte: 3,
        costo_unitario: 17,
        id: "quote-client-1",
        proveedor: {
          contacto: null,
          created_at: "2026-05-20T09:00:00.000Z",
          direccion: null,
          disponible_para_cliente: true,
          email: null,
          estado: "activo",
          id: "provider-1",
          nombre: "Proveedor visible",
          notas: null,
          organizacion_id: "org-1",
          ruc: null,
          telefono: null,
          updated_at: "2026-05-20T10:00:00.000Z"
        }
      })
    });

    const result = await selectDraftResourceClientQuote(
      harness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      "draft-resource-1",
      { quoteId: "quote-client-1" }
    );

    expect(result.ok).toBe(true);
    expect(harness.updates.presupuesto_borrador_partida_recursos[0]).toEqual({
      cotizacion_cliente_id: "quote-client-1",
      motivo_precio_cliente_override: null,
      precio_cliente_actual: 20,
      precio_cliente_advertencia: null,
      precio_cliente_origen: "proveedor_visible",
      precio_cliente_override: false
    });
    expect(harness.inserts.activity_events[0]).toMatchObject({
      action: "select_precio_cliente",
      actor_id: "user-1",
      entity_id: "draft-resource-1",
      entity_type: "presupuesto_borrador_recurso",
      presupuesto_borrador_id: "draft-1"
    });
    expect(harness.bundleReloads).toBe(1);
    if (result.ok) {
      expect(result.data.resources[0]).toMatchObject({
        cotizacion_cliente_id: "quote-client-1",
        precio_cliente_actual: 20,
        precio_cliente_origen: "proveedor_visible",
        precio_cliente_override: false
      });
    }
  });

  it("aplica override manual validado, marca origen override_manual y recarga el bundle", async () => {
    const harness = createBudgetRpcClient();

    const invalidResult = await overrideDraftClientPrice(
      harness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      "draft-resource-1",
      { motivo_precio_cliente_override: "Ajuste comercial", precio_cliente_actual: -1 }
    );

    expect(invalidResult.ok).toBe(false);
    expect(harness.updates.presupuesto_borrador_partida_recursos).toHaveLength(0);

    const result = await overrideDraftClientPrice(
      harness.client,
      {
        actorId: "user-1",
        organizacionId: "org-1",
        proyectoId: "project-1"
      },
      "draft-resource-1",
      { motivo_precio_cliente_override: "Ajuste comercial", precio_cliente_actual: 25.5 }
    );

    expect(result.ok).toBe(true);
    expect(harness.updates.presupuesto_borrador_partida_recursos[0]).toEqual({
      motivo_precio_cliente_override: "Ajuste comercial",
      precio_cliente_actual: 25.5,
      precio_cliente_advertencia: null,
      precio_cliente_origen: "override_manual",
      precio_cliente_override: true
    });
    expect(harness.inserts.activity_events[0]).toMatchObject({
      action: "override_precio_cliente",
      actor_id: "user-1",
      entity_id: "draft-resource-1",
      entity_type: "presupuesto_borrador_recurso",
      presupuesto_borrador_id: "draft-1"
    });
    expect(harness.bundleReloads).toBe(1);
    if (result.ok) {
      expect(result.data.resources[0]).toMatchObject({
        motivo_precio_cliente_override: "Ajuste comercial",
        precio_cliente_actual: 25.5,
        precio_cliente_origen: "override_manual",
        precio_cliente_override: true
      });
    }
  });
});

function createDraft(overrides: Partial<PresupuestoBorrador> = {}): PresupuestoBorrador {
  return {
    cliente: "Cliente Demo",
    created_at: "2026-05-20T09:00:00.000Z",
    created_by: "user-1",
    estado: "activo",
    gastos_generales_porcentaje: 10,
    gastos_generales_total: 0,
    id: "draft-1",
    igv_porcentaje: 18,
    igv_total: 0,
    moneda: "PEN",
    nombre: "Presupuesto Demo",
    organizacion_id: "org-1",
    proyecto_id: "project-1",
    subtotal: 0,
    subtotal_con_margen: 0,
    total: 0,
    ubicacion: "Lima",
    updated_at: "2026-05-20T10:00:00.000Z",
    updated_by: "user-1",
    utilidad_porcentaje: 10,
    utilidad_total: 0,
    ...overrides
  };
}

function createLine(overrides: Partial<PresupuestoBorradorPartida> = {}): PresupuestoBorradorPartida {
  return {
    autoactualizar_precio: true,
    categoria_snapshot: null,
    codigo_snapshot: "01.01",
    created_at: "2026-05-20T09:00:00.000Z",
    cuadrilla_snapshot: null,
    descripcion_snapshot: null,
    especificaciones_snapshot: null,
    id: "line-1",
    metrado: 1,
    motivo_precio_fijado: null,
    nombre_snapshot: "Partida demo",
    orden: 1,
    parcial: 10,
    partida_id: "partida-1",
    precio_fijado: false,
    precio_origen: "catalogo",
    precio_unitario_actual: 10,
    presupuesto_borrador_id: "draft-1",
    rendimiento_snapshot: null,
    unidad_snapshot: "m2",
    updated_at: "2026-05-20T10:00:00.000Z",
    ...overrides
  };
}

function createVersion(overrides: Partial<PresupuestoVersion> = {}): PresupuestoVersion {
  return {
    cliente: "Cliente Demo",
    created_at: "2026-05-20T10:01:00.000Z",
    emitida_at: "2026-05-20T10:01:00.000Z",
    emitida_por: "user-1",
    estado: "emitida",
    gastos_generales_porcentaje: 10,
    gastos_generales_total: 0,
    id: "version-1",
    igv_porcentaje: 18,
    igv_total: 0,
    moneda: "PEN",
    nombre: "Presupuesto Demo_V1",
    numero_version: 1,
    organizacion_id: "org-1",
    presupuesto_borrador_id: "draft-1",
    proyecto_id: "project-1",
    subtotal: 0,
    subtotal_con_margen: 0,
    total: 0,
    ubicacion: "Lima",
    utilidad_porcentaje: 10,
    utilidad_total: 0,
    ...overrides
  };
}

function createVersionLine(overrides: Record<string, unknown> = {}) {
  return {
    id: "version-line-1",
    orden: 1,
    presupuesto_version_id: "version-1",
    ...overrides
  };
}

function createVersionResource(
  overrides: Partial<PresupuestoVersionPartidaRecurso> = {}
): PresupuestoVersionPartidaRecurso {
  return {
    cantidad: 1,
    costo_transporte_snapshot: 5,
    costo_unitario_snapshot: 40,
    cotizacion_cliente_id_snapshot: "quote-client-1",
    cotizacion_interna_id_snapshot: "quote-internal-1",
    created_at: "2026-05-20T10:01:00.000Z",
    desperdicio_porcentaje: 0,
    fecha_precio_snapshot: "2026-05-20",
    fuente_precio_snapshot: "Cotizacion",
    grupo: "materiales",
    id: "version-resource-1",
    nombre_snapshot: "Cemento",
    orden: 1,
    parcial_snapshot: 45,
    partida_recurso_id: "partida-resource-1",
    precio_cliente_advertencia_snapshot: null,
    precio_cliente_origen_snapshot: "proveedor_visible",
    precio_cliente_snapshot: 60,
    precio_fijado_snapshot: false,
    precio_origen_snapshot: "snapshot",
    presupuesto_version_id: "version-1",
    presupuesto_version_partida_id: "version-line-1",
    proveedor_id_snapshot: "provider-1",
    proveedor_nombre_snapshot: "Proveedor Demo",
    recurso_id: "resource-1",
    rendimiento_factor: 1,
    tipo_snapshot: "material",
    unidad: "bolsa",
    unidad_snapshot: "bolsa",
    ...overrides
  };
}

function createDraftResource(
  overrides: Partial<PresupuestoBorradorPartidaRecurso> = {}
): PresupuestoBorradorPartidaRecurso {
  return {
    autoactualizar_precio: true,
    cantidad: 1,
    costo_transporte_actual: 2,
    costo_unitario_actual: 10,
    cotizacion_cliente_id: null,
    cotizacion_interna_id: null,
    created_at: "2026-05-20T09:00:00.000Z",
    desperdicio_porcentaje: 0,
    fecha_precio_snapshot: null,
    fuente_precio_snapshot: null,
    grupo: "materiales",
    id: "draft-resource-1",
    motivo_precio_cliente_override: null,
    motivo_precio_fijado: null,
    nombre_snapshot: "Cemento",
    orden: 1,
    parcial_actual: 12,
    partida_recurso_id: "partida-resource-1",
    precio_cliente_actual: null,
    precio_cliente_advertencia: null,
    precio_cliente_origen: null,
    precio_cliente_override: false,
    precio_fijado: false,
    precio_origen: "catalogo",
    presupuesto_borrador_id: "draft-1",
    presupuesto_borrador_partida_id: "line-1",
    proveedor_id_snapshot: null,
    proveedor_nombre_snapshot: null,
    recurso_id: "resource-1",
    rendimiento_factor: null,
    tipo_snapshot: "material",
    unidad: "bolsa",
    unidad_snapshot: "bolsa",
    updated_at: "2026-05-20T10:00:00.000Z",
    ...overrides
  } as PresupuestoBorradorPartidaRecurso;
}

function createQuote(overrides: Partial<RecursoProveedorPrecio> = {}): RecursoProveedorPrecio {
  return {
    costo_transporte: 0,
    costo_unitario: 10,
    created_at: "2026-05-20T09:00:00.000Z",
    es_preferido_interno: false,
    estado: "activo",
    fecha_cotizacion: null,
    fuente_precio: null,
    id: "quote-1",
    moneda: "PEN",
    organizacion_id: "org-1",
    proveedor_id: "provider-1",
    recurso_id: "resource-1",
    updated_at: "2026-05-20T10:00:00.000Z",
    url_referencia: null,
    vigente_desde: null,
    vigente_hasta: null,
    ...overrides
  };
}

function createBudgetRpcClient(options: {
  draft?: PresupuestoBorrador;
  lineUpdateConflict?: boolean;
  latestLineAfterUpdate?: PresupuestoBorradorPartida;
  lines?: PresupuestoBorradorPartida[];
  officialResources?: PresupuestoVersionPartidaRecurso[];
  quote?: RecursoProveedorPrecio;
  rpcData?: unknown;
  rpcError?: { code?: string; message: string };
  versions?: PresupuestoVersion[];
} = {}) {
  const draft = options.draft || createDraft();
  let lines = options.lines || [createLine()];
  const resources = [createDraftResource()];
  const rpcCalls: Array<{ args: unknown; name: string }> = [];
  let bundleReloads = 0;
  const deletes: Record<string, number> = {
    presupuesto_borrador_partidas: 0
  };
  const inserts: Record<string, unknown[]> = {
    activity_events: []
  };
  const updates: Record<string, unknown[]> = {
    presupuesto_borrador_partidas: [],
    presupuesto_borrador_partida_recursos: [],
    presupuesto_borradores: []
  };

  const client = {
    rpc(name: string, args: unknown) {
      rpcCalls.push({ args, name });

      return Promise.resolve({
        data: options.rpcData || {
          draft,
          lines,
          resources,
          versions: options.versions || []
        },
        error: options.rpcError || null
      });
    },
    from(table: string) {
      const state: { operation?: "delete" | "update"; payload?: unknown } = {};
      const chain = {
        delete() {
          state.operation = "delete";
          if (table in deletes) {
            deletes[table] += 1;
          }

          return chain;
        },
        eq() {
          return chain;
        },
        insert() {
          if (table in inserts) {
            inserts[table].push(arguments[0]);
          }

          return Promise.resolve({ error: null });
        },
        maybeSingle() {
          if (table === "presupuesto_borradores") {
            if (!state.operation) {
              bundleReloads += 1;
            }

            return Promise.resolve({
              data: state.operation === "update" ? { ...draft, ...(state.payload as object) } : draft,
              error: null
            });
          }

          if (table === "presupuesto_borrador_partidas") {
            if (state.operation === "update") {
              if (options.lineUpdateConflict) {
                return Promise.resolve({ data: null, error: null });
              }

              lines[0] = {
                ...lines[0],
                ...(state.payload as object),
                updated_at: "2026-05-20T10:01:00.000Z"
              };

              return Promise.resolve({
                data: options.latestLineAfterUpdate || lines[0],
                error: null
              });
            }

            if (state.operation === "delete") {
              return Promise.resolve({ data: lines[0], error: null });
            }

            return Promise.resolve({
              data: options.lineUpdateConflict ? options.latestLineAfterUpdate || lines[0] : lines[0],
              error: null
            });
          }

          if (table === "presupuesto_borrador_partida_recursos") {
            if (state.operation === "update") {
              resources[0] = {
                ...resources[0],
                ...(state.payload as object),
                updated_at: "2026-05-20T10:01:00.000Z"
              };

              return Promise.resolve({ data: resources[0], error: null });
            }

            return Promise.resolve({ data: resources[0], error: null });
          }

          if (table === "recurso_proveedor_precios") {
            return Promise.resolve({ data: options.quote || createQuote(), error: null });
          }

          if (table === "presupuesto_versiones") {
            return Promise.resolve({
              data: (options.versions || [createVersion()])[0],
              error: null
            });
          }

          return Promise.resolve({ data: null, error: null });
        },
        order() {
          if (table === "presupuesto_borrador_partidas") {
            return Promise.resolve({ data: lines, error: null });
          }

          if (table === "presupuesto_borrador_partida_recursos") {
            return Promise.resolve({ data: resources, error: null });
          }

          if (table === "presupuesto_versiones") {
            return Promise.resolve({ data: options.versions || [], error: null });
          }

          if (table === "presupuesto_version_partidas") {
            return Promise.resolve({ data: [createVersionLine()], error: null });
          }

          if (table === "presupuesto_version_partida_recursos") {
            return Promise.resolve({ data: options.officialResources || [], error: null });
          }

          return Promise.resolve({ data: [], error: null });
        },
        select() {
          return chain;
        },
        update(payload: unknown) {
          state.operation = "update";
          state.payload = payload;

          if (table in updates) {
            updates[table].push(payload);
          }

          return chain;
        },
        then(resolve: (value: { error: null }) => unknown) {
          if (table === "presupuesto_borrador_partidas" && state.operation === "update") {
            if (options.lineUpdateConflict) {
              return Promise.resolve({ error: null }).then(resolve);
            }

            lines[0] = {
              ...lines[0],
              ...(state.payload as object),
              updated_at: "2026-05-20T10:01:00.000Z"
            };
          }

          return Promise.resolve({ error: null }).then(resolve);
        }
      };

      if (
        table === "presupuesto_borradores" ||
        table === "presupuesto_borrador_partidas" ||
        table === "presupuesto_borrador_partida_recursos" ||
        table === "presupuesto_version_partidas" ||
        table === "presupuesto_version_partida_recursos" ||
        table === "presupuesto_versiones" ||
        table === "recurso_proveedor_precios" ||
        table === "activity_events"
      ) {
        return chain;
      }

      throw new Error(`Tabla no esperada: ${table}`);
    }
  } as unknown as DataClient;

  return {
    client,
    deletes,
    get bundleReloads() {
      return bundleReloads;
    },
    inserts,
    rpcCalls,
    updates
  };
}
