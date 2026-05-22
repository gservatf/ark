import { describe, expect, it } from "vitest";

import {
  apuPreviewPercentageSchema,
  budgetDraftMetradoUpdateSchema,
  budgetDraftUpdateSchema
} from "./budgets";
import { validateFormData } from "./form";
import { partidaApuResourceFormSchema } from "./items";
import { precioClienteOverrideSchema, recursoProveedorPrecioInputSchema } from "./quotes";
import { recursoInputSchema } from "./resources";

describe("form validations", () => {
  it("coacciona numeros de recursos y devuelve errores por campo", () => {
    const parsed = validateFormData(recursoInputSchema, {
      costo_transporte: "4.25",
      costo_unitario_actual: "42.50",
      estado: "activo",
      nombre: "Porcelanato",
      tipo: "material",
      transporte_aplica: true,
      unidad: "m2"
    });

    expect(parsed.errors).toEqual({});
    expect(parsed.data?.costo_unitario_actual).toBe(42.5);
    expect(parsed.data?.costo_transporte).toBe(4.25);

    const invalid = validateFormData(recursoInputSchema, {
      costo_transporte: "0",
      costo_unitario_actual: "-1",
      estado: "activo",
      nombre: "",
      tipo: "material",
      transporte_aplica: false,
      unidad: ""
    });

    expect(invalid.data).toBeUndefined();
    expect(invalid.errors).toMatchObject({
      costo_unitario_actual: "El costo unitario no puede ser negativo.",
      nombre: "El nombre es obligatorio.",
      unidad: "La unidad es obligatoria."
    });
  });

  it("valida cotizaciones con costos string, recurso/proveedor y vigencia", () => {
    const parsed = validateFormData(recursoProveedorPrecioInputSchema, {
      costo_transporte: "1.5",
      costo_unitario: "10",
      fecha_cotizacion: "",
      proveedor_id: "prov-1",
      recurso_id: "rec-1",
      vigente_desde: "2026-05-01",
      vigente_hasta: "2026-05-30"
    });

    expect(parsed.errors).toEqual({});
    expect(parsed.data?.costo_unitario).toBe(10);
    expect(parsed.data?.moneda).toBe("PEN");

    const invalid = validateFormData(recursoProveedorPrecioInputSchema, {
      costo_transporte: "0",
      costo_unitario: "",
      proveedor_id: "",
      recurso_id: "",
      vigente_desde: "2026-06-01",
      vigente_hasta: "2026-05-01"
    });

    expect(invalid.errors).toMatchObject({
      costo_unitario: "El costo unitario debe ser un número.",
      proveedor_id: "El proveedor es obligatorio.",
      recurso_id: "El recurso es obligatorio."
    });

    expect(validateFormData(recursoProveedorPrecioInputSchema, {
      costo_transporte: "0",
      costo_unitario: "10",
      proveedor_id: "prov-1",
      recurso_id: "rec-1",
      vigente_desde: "2026-06-01",
      vigente_hasta: "2026-05-01"
    }).errors).toMatchObject({
      vigente_hasta: "La fecha fin de vigencia no puede ser anterior al inicio."
    });
  });

  it("aplica defaults y limites exactos en cotizaciones y porcentajes", () => {
    const quote = recursoProveedorPrecioInputSchema.safeParse({
      costo_transporte: "0",
      costo_unitario: "0",
      proveedor_id: "prov-1",
      recurso_id: "rec-1"
    });

    expect(quote.success).toBe(true);
    if (quote.success) {
      expect(quote.data.estado).toBe("activo");
      expect(quote.data.es_preferido_interno).toBe(false);
      expect(quote.data.moneda).toBe("PEN");
    }

    expect(budgetDraftUpdateSchema.safeParse({ gastos_generales_porcentaje: "0" }).success).toBe(true);
    expect(budgetDraftUpdateSchema.safeParse({ utilidad_porcentaje: "100" }).success).toBe(true);
    expect(apuPreviewPercentageSchema.safeParse({ porcentaje: "100.01" }).success).toBe(false);
  });

  it("valida formularios de presupuesto con porcentajes y metrados string", () => {
    const draft = validateFormData(budgetDraftUpdateSchema, {
      cliente: "",
      gastos_generales_porcentaje: "12.5",
      igv_porcentaje: "18",
      nombre: "Presupuesto demo",
      ubicacion: "",
      utilidad_porcentaje: "8"
    });

    expect(draft.errors).toEqual({});
    expect(draft.data?.gastos_generales_porcentaje).toBe(12.5);

    expect(
      validateFormData(budgetDraftUpdateSchema, {
        gastos_generales_porcentaje: "101",
        nombre: ""
      }).errors
    ).toMatchObject({
      gastos_generales_porcentaje: "Los gastos generales debe estar entre 0 y 100.",
      nombre: "El nombre es obligatorio."
    });

    expect(validateFormData(budgetDraftMetradoUpdateSchema, { metrado: "3.25" }).data?.metrado).toBe(3.25);
    expect(validateFormData(budgetDraftMetradoUpdateSchema, { metrado: "-1" }).errors).toMatchObject({
      metrado: "El metrado no puede ser negativo."
    });
  });

  it("rechaza campos extra en actualizacion de borrador", () => {
    const parsed = budgetDraftUpdateSchema.safeParse({
      nombre: "Presupuesto demo",
      total: 999
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().formErrors.join(" ")).toContain("Unrecognized key");
    }
  });

  it("valida override cliente y porcentajes de simulacion APU", () => {
    expect(
      validateFormData(precioClienteOverrideSchema, {
        motivo_precio_cliente_override: "Ajuste comercial",
        precio_cliente_actual: "25.50"
      }).data?.precio_cliente_actual
    ).toBe(25.5);

    expect(validateFormData(precioClienteOverrideSchema, { precio_cliente_actual: "-1" }).errors).toMatchObject({
      precio_cliente_actual: "El precio cliente no puede ser negativo."
    });

    expect(apuPreviewPercentageSchema.safeParse({ porcentaje: "99.5" }).success).toBe(true);
    expect(apuPreviewPercentageSchema.safeParse({ porcentaje: "101" }).success).toBe(false);
  });

  it("valida builder APU con strings numericos y recurso obligatorio", () => {
    const parsed = validateFormData(partidaApuResourceFormSchema, {
      cantidad: "2",
      desperdicio_porcentaje: "10",
      grupo: "materiales",
      partida_id: "part-1",
      recurso_id: "rec-1",
      rendimiento_factor: "1.5"
    });

    expect(parsed.errors).toEqual({});
    expect(parsed.data?.cantidad).toBe(2);
    expect(parsed.data?.desperdicio_porcentaje).toBe(10);
    expect(parsed.data?.rendimiento_factor).toBe(1.5);

    const invalid = validateFormData(partidaApuResourceFormSchema, {
      cantidad: "2",
      desperdicio_porcentaje: "101",
      grupo: "materiales",
      partida_id: "part-1",
      recurso_id: "",
      rendimiento_factor: "0"
    });

    expect(invalid.errors).toMatchObject({
      desperdicio_porcentaje: "El desperdicio debe estar entre 0 y 100.",
      recurso_id: "El recurso es obligatorio.",
      rendimiento_factor: "El factor de rendimiento debe ser mayor que 0."
    });
  });
});
