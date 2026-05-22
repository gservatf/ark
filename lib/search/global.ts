import type { Partida, Proveedor, Proyecto, Recurso } from "@/types/domain";

export type GlobalSearchResult = {
  href: string;
  id: string;
  subtitle: string;
  title: string;
  type: "proyecto" | "partida" | "recurso" | "proveedor";
};

type GlobalSearchInput = {
  partidas: Partida[];
  proveedores: Proveedor[];
  proyectos: Proyecto[];
  recursos: Recurso[];
};

const resultLimit = 8;

export function buildGlobalSearchResults(
  query: string,
  input: GlobalSearchInput
): GlobalSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  return [
    ...input.proyectos.map((project) => ({
      href: `/presupuestos/${project.id}`,
      id: project.id,
      searchable: [project.nombre, project.cliente, project.ubicacion, project.codigo],
      subtitle: [project.cliente, project.ubicacion].filter(Boolean).join(" - ") || "Proyecto",
      title: project.nombre,
      type: "proyecto" as const
    })),
    ...input.partidas.map((item) => ({
      href: `/partidas/${item.id}`,
      id: item.id,
      searchable: [item.codigo, item.nombre, item.categoria],
      subtitle: [item.codigo, item.unidad].filter(Boolean).join(" - ") || "Partida",
      title: item.nombre,
      type: "partida" as const
    })),
    ...input.recursos.map((resource) => ({
      href: "/recursos",
      id: resource.id,
      searchable: [resource.nombre, resource.tipo, resource.unidad, resource.marca],
      subtitle: [resource.tipo, resource.unidad].filter(Boolean).join(" - ") || "Recurso",
      title: resource.nombre,
      type: "recurso" as const
    })),
    ...input.proveedores.map((provider) => ({
      href: "/proveedores",
      id: provider.id,
      searchable: [provider.nombre, provider.ruc, provider.contacto, provider.email],
      subtitle: provider.ruc ? `RUC ${provider.ruc}` : "Proveedor",
      title: provider.nombre,
      type: "proveedor" as const
    }))
  ]
    .filter((result) =>
      result.searchable.some((value) => normalizeSearchText(value || "").includes(normalizedQuery))
    )
    .slice(0, resultLimit)
    .map(({ searchable: _searchable, ...result }) => result);
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
