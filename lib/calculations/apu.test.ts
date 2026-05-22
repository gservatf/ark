import { describe, expect, it } from "vitest";
import {
  calculateApuDirectCost,
  calculateApuResourcePartial,
  calculateApuUnitPrice
} from "./apu";

describe("calculos APU", () => {
  it("calcula el parcial de un recurso con transporte y desperdicio", () => {
    expect(
      calculateApuResourcePartial({
        cantidad: 2,
        costo_unitario_snapshot: 50,
        costo_transporte_snapshot: 5,
        desperdicio_porcentaje: 10
      })
    ).toBe(120);
  });

  it("mantiene rendimiento_factor fuera del parcial financiero", () => {
    expect(
      calculateApuResourcePartial({
        cantidad: 2,
        costo_unitario_snapshot: 50,
        costo_transporte_snapshot: 5,
        desperdicio_porcentaje: 10,
        rendimiento_factor: 1.5
      })
    ).toBe(120);
  });

  it("redondea parciales monetarios a 2 decimales", () => {
    expect(
      calculateApuResourcePartial({
        cantidad: 3,
        costo_unitario_snapshot: 0.1,
        costo_transporte_snapshot: 0,
        desperdicio_porcentaje: 0
      })
    ).toBe(0.3);
  });

  it("agrupa costo directo por materiales, mano de obra y equipos/herramientas", () => {
    expect(
      calculateApuDirectCost([
        {
          grupo: "materiales",
          cantidad: 1,
          costo_unitario_snapshot: 100,
          costo_transporte_snapshot: 10,
          desperdicio_porcentaje: 0
        },
        {
          grupo: "mano_obra",
          cantidad: 2,
          costo_unitario_snapshot: 40,
          costo_transporte_snapshot: 0,
          desperdicio_porcentaje: 0
        },
        {
          grupo: "equipos_herramientas",
          cantidad: 3,
          costo_unitario_snapshot: 20,
          costo_transporte_snapshot: 5,
          desperdicio_porcentaje: 0
        }
      ])
    ).toEqual({
      costo_materiales: 110,
      costo_mano_obra: 80,
      costo_equipos_herramientas: 75,
      costo_directo: 265
    });
  });

  it("calcula precio unitario desde costo directo, gastos generales y utilidad", () => {
    expect(
      calculateApuUnitPrice({
        costo_directo: 100,
        gastos_generales_porcentaje: 10,
        utilidad_porcentaje: 8
      })
    ).toEqual({
      costo_directo: 100,
      gastos_generales: 10,
      utilidad: 8,
      precio_unitario: 118
    });
  });

  it("rechaza costos negativos y porcentajes fuera de rango", () => {
    expect(() =>
      calculateApuResourcePartial({
        cantidad: 1,
        costo_unitario_snapshot: -1,
        costo_transporte_snapshot: 0,
        desperdicio_porcentaje: 0
      })
    ).toThrow(RangeError);

    expect(() =>
      calculateApuUnitPrice({
        costo_directo: 100,
        gastos_generales_porcentaje: 101,
        utilidad_porcentaje: 10
      })
    ).toThrow(RangeError);
  });
});
