import { describe, expect, it } from "vitest";
import { calculateBudgetLinePartial, calculateBudgetTotals } from "./budget";

describe("calculos de presupuesto", () => {
  it("calcula el parcial de una linea de presupuesto", () => {
    expect(
      calculateBudgetLinePartial({
        metrado: 12.5,
        precio_unitario_snapshot: 80
      })
    ).toBe(1000);
  });

  it("recalcula totales desde metrados y precios unitarios snapshot", () => {
    expect(
      calculateBudgetTotals({
        lines: [
          {
            metrado: 10,
            precio_unitario_snapshot: 100
          },
          {
            metrado: 5,
            precio_unitario_snapshot: 200
          }
        ],
        gastos_generales_porcentaje: 10,
        utilidad_porcentaje: 5,
        igv_porcentaje: 18
      })
    ).toEqual({
      subtotal: 2000,
      gastos_generales_total: 200,
      utilidad_total: 100,
      subtotal_con_margen: 2300,
      igv_total: 414,
      total: 2714
    });
  });

  it("redondea parciales y totales monetarios a 2 decimales", () => {
    expect(
      calculateBudgetLinePartial({
        metrado: 3,
        precio_unitario_snapshot: 0.1
      })
    ).toBe(0.3);

    expect(
      calculateBudgetTotals({
        lines: [
          {
            metrado: 3,
            precio_unitario_snapshot: 0.1
          }
        ],
        gastos_generales_porcentaje: 10,
        utilidad_porcentaje: 10,
        igv_porcentaje: 18
      })
    ).toEqual({
      subtotal: 0.3,
      gastos_generales_total: 0.03,
      utilidad_total: 0.03,
      subtotal_con_margen: 0.36,
      igv_total: 0.06,
      total: 0.42
    });
  });

  it("rechaza metrados negativos y porcentajes fuera de rango", () => {
    expect(() =>
      calculateBudgetLinePartial({
        metrado: -1,
        precio_unitario_snapshot: 80
      })
    ).toThrow(RangeError);

    expect(() =>
      calculateBudgetTotals({
        lines: [],
        gastos_generales_porcentaje: 10,
        utilidad_porcentaje: 5,
        igv_porcentaje: 120
      })
    ).toThrow(RangeError);
  });
});
