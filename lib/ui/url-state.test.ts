import { describe, expect, it } from "vitest";

import {
  parsePartidaFilters,
  parseProviderFilters,
  parseResourceFilters,
  serializePartidaFilters,
  serializeProviderFilters,
  serializeResourceFilters,
  setOptionalParam
} from "./url-state";

describe("ui url state", () => {
  it("parsea filtros de proveedores y descarta valores invalidos", () => {
    expect(parseProviderFilters("?q=acero&estado=roto&cliente=visible")).toEqual({
      clientVisibility: "visible",
      query: "acero",
      status: "activo"
    });
  });

  it("serializa filtros de proveedores omitiendo defaults", () => {
    expect(
      serializeProviderFilters({
        clientVisibility: "todos",
        query: "  norte ",
        status: "inactivo"
      }).toString()
    ).toBe("q=norte&estado=inactivo");
  });

  it("parsea y serializa filtros de recursos", () => {
    const parsed = parseResourceFilters("?q=cemento&tipo=material&proveedor=prov-1&estado=activo");

    expect(parsed).toEqual({
      providerId: "prov-1",
      query: "cemento",
      status: "activo",
      type: "material"
    });
    expect(serializeResourceFilters(parsed).toString()).toBe(
      "q=cemento&estado=activo&tipo=material&proveedor=prov-1"
    );
  });

  it("parsea y serializa filtros de partidas", () => {
    const parsed = parsePartidaFilters("?q=tarrajeo&categoria=Arquitectura&estado=inactivo");

    expect(parsed).toEqual({
      category: "Arquitectura",
      query: "tarrajeo",
      status: "inactivo"
    });
    expect(serializePartidaFilters(parsed).toString()).toBe(
      "q=tarrajeo&estado=inactivo&categoria=Arquitectura"
    );
  });

  it("setOptionalParam agrega y remueve parametros sin tocar el resto", () => {
    expect(setOptionalParam("?q=a", "linea", "line-1").toString()).toBe("q=a&linea=line-1");
    expect(setOptionalParam("?q=a&linea=line-1", "linea", null).toString()).toBe("q=a");
  });
});
