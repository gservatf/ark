import { describe, expect, it } from "vitest";

import {
  quoteTotalUnitPrice,
  resolveClientPriceForResource,
  resolveManualClientPrice,
  selectInternalQuote,
  type QuoteWithProvider
} from "./client-prices";

describe("precios cliente multi-proveedor", () => {
  it("selecciona el precio cliente visible mas caro usando costo unitario mas transporte", () => {
    const result = resolveClientPriceForResource([
      createQuote({ id: "q1", costo_unitario: 30, costo_transporte: 5, visible: true }),
      createQuote({ id: "q2", costo_unitario: 33, costo_transporte: 4, visible: true }),
      createQuote({ id: "q3", costo_unitario: 40, costo_transporte: 0, visible: false })
    ]);

    expect(result).toMatchObject({
      advertencia: null,
      origen: "proveedor_visible",
      precio: 37
    });
    expect(result?.cotizacion?.id).toBe("q2");
  });

  it("usa fallback general mas caro con advertencia si no hay proveedor visible", () => {
    const result = resolveClientPriceForResource([
      createQuote({ id: "q1", costo_unitario: 90, costo_transporte: 0, visible: false }),
      createQuote({ id: "q2", costo_unitario: 78, costo_transporte: 3, visible: false })
    ]);

    expect(result?.origen).toBe("fallback_general");
    expect(result?.precio).toBe(90);
    expect(result?.cotizacion?.id).toBe("q1");
    expect(result?.advertencia).toContain("No hay cotización");
  });

  it("prepara override manual como precio congelable", () => {
    expect(resolveManualClientPrice(125)).toEqual({
      advertencia: null,
      cotizacion: null,
      origen: "override_manual",
      precio: 125
    });
  });

  it("selecciona cotizacion interna preferida antes de la mas reciente", () => {
    const result = selectInternalQuote([
      createQuote({ id: "q1", preferido: false, updated_at: "2026-05-20" }),
      createQuote({ id: "q2", preferido: true, updated_at: "2026-05-01" })
    ]);

    expect(result?.id).toBe("q2");
  });

  it("ignora cotizaciones internas fuera de vigencia", () => {
    const result = selectInternalQuote(
      [
        createQuote({
          id: "q1",
          preferido: true,
          vigente_desde: "2026-04-01",
          vigente_hasta: "2026-04-30"
        }),
        createQuote({
          id: "q2",
          preferido: false,
          vigente_desde: "2026-05-01",
          vigente_hasta: "2026-05-31"
        })
      ],
      new Date("2026-05-20T00:00:00")
    );

    expect(result?.id).toBe("q2");
  });

  it("excluye proveedores inactivos del fallback cliente", () => {
    const result = resolveClientPriceForResource(
      [
        createQuote({
          id: "q1",
          costo_unitario: 100,
          proveedor: {
            disponible_para_cliente: false,
            estado: "inactivo",
            nombre: "Proveedor inactivo"
          }
        }),
        createQuote({ id: "q2", costo_unitario: 80, visible: false })
      ],
      new Date("2026-05-20T00:00:00")
    );

    expect(result?.origen).toBe("fallback_general");
    expect(result?.cotizacion?.id).toBe("q2");
  });

  it("rechaza montos negativos", () => {
    expect(() => quoteTotalUnitPrice(createQuote({ costo_unitario: -1 }))).toThrow(RangeError);
  });
});

function createQuote(overrides: Partial<QuoteWithProvider> & { visible?: boolean; preferido?: boolean } = {}): QuoteWithProvider {
  return {
    costo_transporte: 0,
    costo_unitario: 10,
    created_at: "2026-05-01",
    es_preferido_interno: overrides.preferido ?? false,
    estado: "activo",
    fecha_cotizacion: "2026-05-01",
    fuente_precio: null,
    id: "q",
    moneda: "PEN",
    organizacion_id: "org-1",
    proveedor: {
      disponible_para_cliente: overrides.visible ?? true,
      estado: "activo",
      nombre: "Proveedor"
    },
    proveedor_id: "prov-1",
    recurso_id: "rec-1",
    updated_at: "2026-05-01",
    url_referencia: null,
    vigente_desde: null,
    vigente_hasta: null,
    ...overrides
  };
}
