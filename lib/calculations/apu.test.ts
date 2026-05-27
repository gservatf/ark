import { describe, expect, it } from "vitest";
import {
  calculateApuDirectCost,
  calculateApuResourcePartial,
  calculateApuResourceValues,
  calculateApuUnitPrice
} from "./apu";

const context = {
  desperdicio_materiales_porcentaje: 5,
  jornada_horas: 8,
  rendimiento: 25
};

describe("calculos APU", () => {
  it("calcula mano de obra con cuadrilla, jornada y rendimiento", () => {
    expect(
      calculateApuResourceValues({
        cantidad: 0,
        costo_unitario_snapshot: 30.28,
        costo_transporte_snapshot: 0,
        cuadrilla: 2,
        tipo_calculo_apu: "mano_obra_rendimiento"
      }, context)
    ).toEqual({ cantidad: 0.64, parcial: 19.38 });
  });

  it("calcula materiales con desperdicio global", () => {
    expect(
      calculateApuResourceValues({
        cantidad: 0,
        cantidad_base: 9.73,
        costo_unitario_snapshot: 26.61,
        costo_transporte_snapshot: 0,
        tipo_calculo_apu: "material_desperdicio"
      }, context)
    ).toEqual({ cantidad: 10.2165, parcial: 271.86 });
  });

  it("calcula equipos HM igual que mano de obra", () => {
    expect(
      calculateApuResourceValues({
        cantidad: 0,
        costo_unitario_snapshot: 0.75,
        costo_transporte_snapshot: 0,
        cuadrilla: 1,
        tipo_calculo_apu: "equipo_hm_rendimiento"
      }, context)
    ).toEqual({ cantidad: 0.32, parcial: 0.24 });
  });

  it("calcula equipos con cantidad fija", () => {
    expect(
      calculateApuResourceValues({
        cantidad: 0,
        cantidad_base: 2,
        costo_unitario_snapshot: 15,
        costo_transporte_snapshot: 1,
        tipo_calculo_apu: "equipo_cantidad_fija"
      }, context)
    ).toEqual({ cantidad: 2, parcial: 32 });
  });

  it("calcula herramientas manuales como porcentaje de mano de obra", () => {
    expect(
      calculateApuResourceValues({
        cantidad: 0,
        costo_unitario_snapshot: 0,
        costo_transporte_snapshot: 0,
        porcentaje_aplicado: 3,
        tipo_calculo_apu: "herramientas_porcentaje_mano_obra"
      }, context, 89.86)
    ).toEqual({ cantidad: 3, parcial: 2.7 });
  });

  it("agrupa costo directo por materiales, mano de obra y equipos/herramientas", () => {
    expect(
      calculateApuDirectCost([
        {
          grupo: "materiales",
          cantidad: 0,
          cantidad_base: 1,
          costo_unitario_snapshot: 100,
          costo_transporte_snapshot: 0,
          tipo_calculo_apu: "material_desperdicio"
        },
        {
          grupo: "mano_obra",
          cantidad: 0,
          costo_unitario_snapshot: 40,
          costo_transporte_snapshot: 0,
          cuadrilla: 2,
          tipo_calculo_apu: "mano_obra_rendimiento"
        },
        {
          grupo: "equipos_herramientas",
          cantidad: 0,
          costo_unitario_snapshot: 20,
          costo_transporte_snapshot: 5,
          cantidad_base: 3,
          tipo_calculo_apu: "equipo_cantidad_fija"
        }
      ], context)
    ).toEqual({
      costo_materiales: 105,
      costo_mano_obra: 25.6,
      costo_equipos_herramientas: 75,
      costo_directo: 205.6
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

  it("usa parcial simple con cantidad ya calculada y rechaza valores invalidos", () => {
    expect(
      calculateApuResourcePartial({
        cantidad: 2,
        costo_unitario_snapshot: 50,
        costo_transporte_snapshot: 5
      })
    ).toBe(110);

    expect(() =>
      calculateApuResourceValues({
        cantidad: 0,
        costo_unitario_snapshot: 10,
        costo_transporte_snapshot: 0,
        cuadrilla: 1,
        tipo_calculo_apu: "mano_obra_rendimiento"
      }, { ...context, rendimiento: 0 })
    ).toThrow(RangeError);
  });
});
