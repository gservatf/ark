import { describe, expect, it } from "vitest";

import { buildGlobalSearchResults } from "./global";

describe("global search", () => {
  it("agrupa resultados navegables de proyectos, partidas, recursos y proveedores", () => {
    const results = buildGlobalSearchResults("arena", {
      partidas: [
        {
          categoria: "Obras",
          codigo: "APU-001",
          created_at: "2026-05-01",
          descripcion: null,
          estado: "activo",
          especificaciones: null,
          id: "partida-1",
          nombre: "Muro de ladrillo",
          organizacion_id: "org-1",
          rendimiento: null,
          cuadrilla: null,
          unidad: "m2",
          updated_at: "2026-05-01"
        }
      ],
      proveedores: [
        {
          contacto: null,
          created_at: "2026-05-01",
          direccion: null,
          disponible_para_cliente: false,
          email: null,
          estado: "activo",
          id: "proveedor-1",
          nombre: "Arenas del Sur",
          notas: null,
          organizacion_id: "org-1",
          ruc: "20123456789",
          telefono: null,
          updated_at: "2026-05-01"
        }
      ],
      proyectos: [
        {
          cliente: "Cliente Arena",
          codigo: null,
          created_at: "2026-05-01",
          created_by: "user-1",
          descripcion: null,
          estado: "activo",
          id: "project-1",
          nombre: "Edificio Arena",
          organizacion_id: "org-1",
          ubicacion: "Lima",
          updated_at: "2026-05-01"
        }
      ],
      recursos: [
        {
          costo_transporte: 0,
          costo_unitario_actual: 10,
          created_at: "2026-05-01",
          especificacion: null,
          estado: "activo",
          fecha_actualizacion_precio: null,
          fuente_precio: null,
          id: "resource-1",
          marca: null,
          nombre: "Arena gruesa",
          organizacion_id: "org-1",
          proveedor_id: null,
          tipo: "material",
          transporte_aplica: false,
          unidad: "m3",
          updated_at: "2026-05-01"
        }
      ]
    });

    expect(results.map((result) => result.type)).toEqual(["proyecto", "recurso", "proveedor"]);
    expect(results[0]).toMatchObject({ href: "/presupuestos/project-1", title: "Edificio Arena" });
    expect(results[1]).toMatchObject({ href: "/recursos", title: "Arena gruesa" });
    expect(results[2]).toMatchObject({ href: "/proveedores", title: "Arenas del Sur" });
  });
});
