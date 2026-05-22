export type ProviderUrlFilters = {
  clientVisibility: "todos" | "visible" | "interno";
  query: string;
  status: "todos" | "activo" | "inactivo";
};

export type ResourceUrlFilters = {
  providerId: string;
  query: string;
  status: "todos" | "activo" | "inactivo";
  type: "todos" | "material" | "mano_obra" | "equipo" | "herramienta";
};

export type PartidaUrlFilters = {
  category: string;
  query: string;
  status: "todos" | "activo" | "inactivo";
};

export const providerFilterDefaults: ProviderUrlFilters = {
  clientVisibility: "todos",
  query: "",
  status: "activo"
};

export const resourceFilterDefaults: ResourceUrlFilters = {
  providerId: "todos",
  query: "",
  status: "todos",
  type: "todos"
};

export const partidaFilterDefaults: PartidaUrlFilters = {
  category: "todas",
  query: "",
  status: "todos"
};

export function parseProviderFilters(search: string | URLSearchParams): ProviderUrlFilters {
  const params = toSearchParams(search);
  const status = params.get("estado");
  const clientVisibility = params.get("cliente");

  return {
    clientVisibility: isOneOf(clientVisibility, ["todos", "visible", "interno"])
      ? clientVisibility
      : providerFilterDefaults.clientVisibility,
    query: params.get("q")?.trim() || providerFilterDefaults.query,
    status: isOneOf(status, ["todos", "activo", "inactivo"])
      ? status
      : providerFilterDefaults.status
  };
}

export function serializeProviderFilters(
  filters: ProviderUrlFilters,
  currentSearch: string | URLSearchParams = ""
) {
  const params = toSearchParams(currentSearch);
  setParam(params, "q", filters.query.trim(), providerFilterDefaults.query);
  setParam(params, "estado", filters.status, providerFilterDefaults.status);
  setParam(params, "cliente", filters.clientVisibility, providerFilterDefaults.clientVisibility);
  return params;
}

export function parseResourceFilters(search: string | URLSearchParams): ResourceUrlFilters {
  const params = toSearchParams(search);
  const status = params.get("estado");
  const type = params.get("tipo");

  return {
    providerId: params.get("proveedor")?.trim() || resourceFilterDefaults.providerId,
    query: params.get("q")?.trim() || resourceFilterDefaults.query,
    status: isOneOf(status, ["todos", "activo", "inactivo"])
      ? status
      : resourceFilterDefaults.status,
    type: isOneOf(type, ["todos", "material", "mano_obra", "equipo", "herramienta"])
      ? type
      : resourceFilterDefaults.type
  };
}

export function serializeResourceFilters(
  filters: ResourceUrlFilters,
  currentSearch: string | URLSearchParams = ""
) {
  const params = toSearchParams(currentSearch);
  setParam(params, "q", filters.query.trim(), resourceFilterDefaults.query);
  setParam(params, "estado", filters.status, resourceFilterDefaults.status);
  setParam(params, "tipo", filters.type, resourceFilterDefaults.type);
  setParam(params, "proveedor", filters.providerId, resourceFilterDefaults.providerId);
  return params;
}

export function parsePartidaFilters(search: string | URLSearchParams): PartidaUrlFilters {
  const params = toSearchParams(search);
  const status = params.get("estado");

  return {
    category: params.get("categoria")?.trim() || partidaFilterDefaults.category,
    query: params.get("q")?.trim() || partidaFilterDefaults.query,
    status: isOneOf(status, ["todos", "activo", "inactivo"])
      ? status
      : partidaFilterDefaults.status
  };
}

export function serializePartidaFilters(
  filters: PartidaUrlFilters,
  currentSearch: string | URLSearchParams = ""
) {
  const params = toSearchParams(currentSearch);
  setParam(params, "q", filters.query.trim(), partidaFilterDefaults.query);
  setParam(params, "estado", filters.status, partidaFilterDefaults.status);
  setParam(params, "categoria", filters.category, partidaFilterDefaults.category);
  return params;
}

export function setOptionalParam(
  currentSearch: string | URLSearchParams,
  key: string,
  value?: string | null
) {
  const params = toSearchParams(currentSearch);

  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }

  return params;
}

function isOneOf<const Value extends string>(
  value: string | null,
  values: readonly Value[]
): value is Value {
  return Boolean(value && values.includes(value as Value));
}

function setParam(params: URLSearchParams, key: string, value: string, defaultValue: string) {
  if (value && value !== defaultValue) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
}

function toSearchParams(search: string | URLSearchParams) {
  return new URLSearchParams(typeof search === "string" ? search : search.toString());
}
