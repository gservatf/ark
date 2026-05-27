import { describe, expect, it } from "vitest";

import { partidaApuResourceFormSchema, partidaInputSchema } from "../validations/items";

describe("items repository schemas", () => {
  it("permite codigo opcional y aplica defaults de partida", () => {
    const parsed = partidaInputSchema.safeParse({
      categoria: "Estructuras",
      codigo: "",
      nombre: "Zapatas concreto",
      unidad: "m3"
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.codigo).toBeNull();
      expect(parsed.data.rendimiento).toBe(1);
      expect(parsed.data.jornada_horas).toBe(8);
      expect(parsed.data.desperdicio_materiales_porcentaje).toBe(5);
      expect(parsed.data.estado).toBe("activo");
    }
  });

  it("rechaza rendimiento cero", () => {
    const parsed = partidaInputSchema.safeParse({
      categoria: "Estructuras",
      nombre: "Zapatas concreto",
      rendimiento: "0",
      unidad: "m3"
    });

    expect(parsed.success).toBe(false);
  });

  it("valida recursos APU por regla de calculo", () => {
    expect(
      partidaApuResourceFormSchema.safeParse({
        cuadrilla: "2",
        grupo: "mano_obra",
        partida_id: "part-1",
        recurso_id: "rec-1",
        tipo_calculo_apu: "mano_obra_rendimiento"
      }).success
    ).toBe(true);

    expect(
      partidaApuResourceFormSchema.safeParse({
        cantidad_base: "9.73",
        grupo: "materiales",
        partida_id: "part-1",
        recurso_id: "rec-2",
        tipo_calculo_apu: "material_desperdicio"
      }).success
    ).toBe(true);

    expect(
      partidaApuResourceFormSchema.safeParse({
        grupo: "materiales",
        partida_id: "part-1",
        recurso_id: "rec-2",
        tipo_calculo_apu: "material_desperdicio"
      }).success
    ).toBe(false);
  });
});
