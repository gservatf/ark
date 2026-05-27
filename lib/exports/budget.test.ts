import { describe, expect, it } from "vitest";

import {
  buildBudgetExportRows,
  buildBudgetFileName,
  buildBudgetPrintHtml,
  buildClientBudgetExportRows,
  buildClientBudgetPrintHtml,
  buildVersionFileName,
  sanitizeExcelCell
} from "./budget";
import type {
  Presupuesto,
  PresupuestoPartida,
  PresupuestoPartidaRecursoSnapshot,
  PresupuestoVersion,
  PresupuestoVersionPartida,
  PresupuestoVersionPartidaRecurso
} from "@/types/domain";

describe("exportaciones de presupuesto", () => {
  it("genera filas oficiales con partidas, resumen financiero y detalle APU", () => {
    const rows = buildBudgetExportRows({
      lines: [versionLine],
      resources: [versionResource],
      source: "official",
      version
    });
    const flat = rows.flat().join(" ");

    expect(flat).toContain("VERSION OFICIAL CONGELADA");
    expect(flat).toContain("Partidas");
    expect(flat).toContain("Resumen financiero");
    expect(flat).toContain("Detalle APU por partida");
    expect(flat).toContain("Cemento");
    expect(flat).toContain("Subtotal con margen");
  });

  it("etiqueta claramente exportaciones de borrador", () => {
    const rows = buildBudgetExportRows({
      budget: draftBudget,
      lines: [draftLine],
      resources: [draftResource],
      source: "draft"
    });
    const flat = rows.flat().join(" ");

    expect(flat).toContain("BORRADOR");
    expect(flat).toContain("Borrador activo");
    expect(flat).toContain("Detalle APU por partida");
  });

  it("genera filas cliente sin revelar proveedores y con notas de advertencia", () => {
    const rows = buildClientBudgetExportRows({
      lines: [versionLine],
      resources: [versionResource],
      version
    });
    const flat = rows.flat().join(" ");

    expect(flat).toContain("Presupuesto para cliente");
    expect(flat).toContain("Sin proveedor visible");
    expect(flat).toContain("Detalle APU por partida");
    expect(flat).not.toContain("Proveedor Interno SAC");
    expect(flat).not.toContain("prov-1");
  });

  it("ordena partidas cliente y redondea parciales/totales monetarios", () => {
    const firstLine = {
      ...versionLine,
      id: "line-1",
      metrado: 3,
      nombre_snapshot: "Primera partida",
      orden: 1
    };
    const secondLine = {
      ...versionLine,
      id: "line-2",
      metrado: 1,
      nombre_snapshot: "Segunda partida",
      orden: 2
    };
    const rows = buildClientBudgetExportRows({
      lines: [secondLine, firstLine],
      resources: [
        {
          ...versionResource,
          cantidad: 0.2,
          costo_transporte_snapshot: 0,
          costo_unitario_snapshot: 0.1,
          id: "res-1",
          parcial_snapshot: 0.02,
          precio_cliente_advertencia_snapshot: null,
          precio_cliente_snapshot: 0.1,
          presupuesto_version_partida_id: "line-1"
        },
        {
          ...versionResource,
          cantidad: 1,
          costo_transporte_snapshot: 0,
          costo_unitario_snapshot: 2,
          id: "res-2",
          parcial_snapshot: 2,
          precio_cliente_advertencia_snapshot: null,
          precio_cliente_snapshot: 2,
          presupuesto_version_partida_id: "line-2"
        }
      ],
      version: {
        ...version,
        gastos_generales_porcentaje: 10,
        igv_porcentaje: 18,
        utilidad_porcentaje: 10
      }
    });

    const firstExportedLine = rows.find((row) => row[2] === "Primera partida");
    const secondExportedLine = rows.find((row) => row[2] === "Segunda partida");

    expect(firstExportedLine?.[0]).toBe(1);
    expect(secondExportedLine?.[0]).toBe(2);
    expect(firstExportedLine?.[6]).toBe(0.06);
    expect(rows).toContainEqual(["Subtotal", 2.06]);
    expect(rows).toContainEqual(["Subtotal con margen", 2.48]);
    expect(rows).toContainEqual(["Total", 2.93]);
  });

  it("usa precio interno congelado como fallback cliente si falta precio cliente snapshot", () => {
    const rows = buildClientBudgetExportRows({
      lines: [versionLine],
      resources: [
        {
          ...versionResource,
          costo_transporte_snapshot: 5,
          costo_unitario_snapshot: 40,
          precio_cliente_advertencia_snapshot: null,
          precio_cliente_snapshot: null
        }
      ],
      version
    });
    const lineRow = rows.find((row) => row[2] === versionLine.nombre_snapshot);
    const apuRow = rows.find((row) => row[4] === versionResource.nombre_snapshot);

    expect(lineRow?.[5]).toBe(45);
    expect(lineRow?.[6]).toBe(90);
    expect(apuRow?.[6]).toBe(45);
    expect(rows.flat().join(" ")).not.toContain("Proveedor Interno SAC");
  });

  it("construye nombres de archivo para borrador, oficial y cliente", () => {
    const generatedAt = new Date("2026-05-22T12:00:00.000Z");

    expect(
      buildBudgetFileName(
        { budget: draftBudget, lines: [draftLine], resources: [draftResource], source: "draft" },
        generatedAt
      )
    ).toBe("proyecto-demo-borrador-2026-05-22");
    expect(
      buildBudgetFileName(
        { lines: [versionLine], resources: [versionResource], source: "official", version },
        generatedAt
      )
    ).toBe("proyecto-demo-v1-2026-05-22");
    expect(buildVersionFileName(version, generatedAt)).toBe("proyecto-demo-v1-2026-05-22");
  });

  it("escapa HTML en vistas imprimibles internas y cliente incluyendo APU", () => {
    const dangerousName = "<script data-x=`1`>alert(1)</script>";
    const internalHtml = buildBudgetPrintHtml({
      lines: [{ ...versionLine, nombre_snapshot: dangerousName }],
      resources: [{ ...versionResource, nombre_snapshot: dangerousName }],
      source: "official",
      version
    });
    const clientHtml = buildClientBudgetPrintHtml({
      lines: [{ ...versionLine, nombre_snapshot: dangerousName }],
      resources: [{ ...versionResource, nombre_snapshot: dangerousName }],
      version
    });
    const escaped = "&lt;script data-x&#061;&#096;1&#096;&gt;alert(1)&lt;/script&gt;";

    expect(internalHtml).toContain(escaped);
    expect(clientHtml).toContain(escaped);
    expect(internalHtml).not.toContain(dangerousName);
    expect(clientHtml).not.toContain(dangerousName);
  });

  it("marca advertencias cliente en rojo en HTML imprimible", () => {
    const html = buildClientBudgetPrintHtml({
      lines: [versionLine],
      resources: [versionResource],
      version
    });

    expect(html).toContain('class="warning"');
    expect(html).toContain("Sin proveedor visible");
    expect(html).not.toContain("Proveedor Interno SAC");
  });

  it("prefija celdas peligrosas para evitar formulas en Excel", () => {
    expect(sanitizeExcelCell("=HYPERLINK(\"https://evil.test\")")).toBe(
      "'=HYPERLINK(\"https://evil.test\")"
    );
    expect(sanitizeExcelCell("+SUM(A1:A2)")).toBe("'+SUM(A1:A2)");
    expect(sanitizeExcelCell("-10+20")).toBe("'-10+20");
    expect(sanitizeExcelCell("@cmd")).toBe("'@cmd");
    expect(sanitizeExcelCell("\t=cmd")).toBe("'\t=cmd");
    expect(sanitizeExcelCell("Partida segura")).toBe("Partida segura");
    expect(sanitizeExcelCell(42)).toBe(42);
  });
});

const draftBudget: Presupuesto = {
  cliente: "Cliente Demo",
  created_at: "2026-05-19",
  estado: "borrador",
  gastos_generales_porcentaje: 10,
  gastos_generales_total: 10,
  id: "draft-1",
  igv_porcentaje: 18,
  igv_total: 23.6,
  moneda: "PEN",
  proyecto_nombre: "Proyecto Demo",
  subtotal: 100,
  subtotal_con_margen: 120,
  total: 143.6,
  ubicacion: "Lima",
  updated_at: "2026-05-19",
  utilidad_porcentaje: 10,
  utilidad_total: 10,
  version: "Borrador activo"
};

const version: PresupuestoVersion = {
  cliente: "Cliente Demo",
  created_at: "2026-05-19",
  emitida_at: "2026-05-19",
  emitida_por: "user-1",
  estado: "emitida",
  gastos_generales_porcentaje: 10,
  gastos_generales_total: 10,
  id: "version-1",
  igv_porcentaje: 18,
  igv_total: 23.6,
  moneda: "PEN",
  nombre: "Proyecto Demo",
  numero_version: 1,
  organizacion_id: "org-1",
  presupuesto_borrador_id: "draft-1",
  proyecto_id: "project-1",
  subtotal: 100,
  subtotal_con_margen: 120,
  total: 143.6,
  ubicacion: "Lima",
  utilidad_porcentaje: 10,
  utilidad_total: 10
};

const versionLine: PresupuestoVersionPartida = {
  categoria_snapshot: "Arquitectura",
  codigo_snapshot: "01.01",
  created_at: "2026-05-19",
  desperdicio_materiales_porcentaje_snapshot: 5,
  especificaciones_snapshot: null,
  id: "line-1",
  jornada_horas_snapshot: 8,
  metrado: 2,
  nombre_snapshot: "Tarrajeo",
  orden: 1,
  parcial_snapshot: 100,
  partida_id: "part-1",
  precio_fijado_snapshot: false,
  precio_origen_snapshot: "snapshot",
  precio_unitario_snapshot: 50,
  presupuesto_version_id: "version-1",
  rendimiento_snapshot: null,
  subcategoria_snapshot: null,
  unidad_snapshot: "m2"
};

const versionResource: PresupuestoVersionPartidaRecurso = {
  cantidad: 1,
  costo_transporte_snapshot: 5,
  costo_unitario_snapshot: 40,
  cotizacion_cliente_id_snapshot: "quote-1",
  cotizacion_interna_id_snapshot: "quote-2",
  created_at: "2026-05-19",
  cantidad_base: 1,
  cuadrilla: null,
  fecha_precio_snapshot: "2026-05-19",
  fuente_precio_snapshot: "Cotizacion",
  grupo: "materiales",
  id: "res-1",
  nombre_snapshot: "Cemento",
  orden: 1,
  parcial_snapshot: 45,
  porcentaje_aplicado: null,
  partida_recurso_id: "part-res-1",
  precio_cliente_advertencia_snapshot: "Sin proveedor visible",
  precio_cliente_origen_snapshot: "fallback_general",
  precio_cliente_snapshot: 60,
  precio_fijado_snapshot: false,
  precio_origen_snapshot: "snapshot",
  presupuesto_version_id: "version-1",
  presupuesto_version_partida_id: "line-1",
  proveedor_id_snapshot: "prov-1",
  proveedor_nombre_snapshot: "Proveedor Interno SAC",
  recurso_id: "rec-1",
  tipo_calculo_apu: "material_desperdicio",
  tipo_snapshot: "material",
  unidad: "bol",
  unidad_snapshot: "bol"
};

const draftLine: PresupuestoPartida = {
  categoria_snapshot: "Arquitectura",
  codigo_snapshot: "01.01",
  desperdicio_materiales_porcentaje_snapshot: 5,
  especificaciones_snapshot: null,
  id: "draft-line-1",
  jornada_horas_snapshot: 8,
  metrado: 2,
  nombre_snapshot: "Tarrajeo",
  orden: 1,
  parcial: 100,
  partida_id: "part-1",
  presupuesto_id: "draft-1",
  precio_unitario_snapshot: 50,
  rendimiento_snapshot: null,
  subcategoria_snapshot: null,
  unidad_snapshot: "m2"
};

const draftResource: PresupuestoPartidaRecursoSnapshot = {
  cantidad: 1,
  cantidad_base: 1,
  costo_transporte_snapshot: 5,
  costo_unitario_snapshot: 40,
  cuadrilla: null,
  fecha_precio_snapshot: "2026-05-19",
  fuente_precio_snapshot: "Cotizacion",
  grupo: "materiales",
  id: "draft-res-1",
  nombre_snapshot: "Cemento",
  orden: 1,
  parcial_snapshot: 45,
  porcentaje_aplicado: null,
  partida_recurso_id: "part-res-1",
  presupuesto_id: "draft-1",
  presupuesto_partida_id: "draft-line-1",
  proveedor_id_snapshot: "prov-1",
  proveedor_nombre_snapshot: "Proveedor Interno SAC",
  recurso_id: "rec-1",
  tipo_calculo_apu: "material_desperdicio",
  tipo_snapshot: "material",
  unidad: "bol",
  unidad_snapshot: "bol"
};
