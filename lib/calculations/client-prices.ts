import type {
  PrecioClienteOrigen,
  Proveedor,
  RecursoProveedorPrecio
} from "@/types/domain";

export type QuoteWithProvider = Omit<RecursoProveedorPrecio, "proveedor"> & {
  proveedor?: Pick<Proveedor, "disponible_para_cliente" | "estado" | "nombre"> | null;
};

export type ResolvedClientPrice = {
  advertencia: string | null;
  cotizacion: QuoteWithProvider | null;
  origen: PrecioClienteOrigen;
  precio: number;
};

const fallbackWarning =
  "No hay cotización de proveedor visible para cliente; se usó el precio general más alto disponible.";

export function quoteTotalUnitPrice(quote: Pick<RecursoProveedorPrecio, "costo_transporte" | "costo_unitario">) {
  return assertNonNegative(quote.costo_unitario, "costo_unitario") +
    assertNonNegative(quote.costo_transporte, "costo_transporte");
}

export function selectInternalQuote(
  quotes: QuoteWithProvider[],
  today = new Date()
): QuoteWithProvider | null {
  return activeQuotes(quotes, today).sort((first, second) => {
    if (first.es_preferido_interno !== second.es_preferido_interno) {
      return first.es_preferido_interno ? -1 : 1;
    }

    return compareQuoteDates(second, first);
  })[0] || null;
}

export function resolveClientPriceForResource(
  quotes: QuoteWithProvider[],
  today = new Date()
): ResolvedClientPrice | null {
  const active = activeQuotes(quotes, today);

  if (active.length === 0) {
    return null;
  }

  const visibleQuote = active
    .filter((quote) => quote.proveedor?.estado === "activo" && quote.proveedor.disponible_para_cliente)
    .sort(compareByTotalPriceDesc)[0];

  if (visibleQuote) {
    return {
      advertencia: null,
      cotizacion: visibleQuote,
      origen: "proveedor_visible",
      precio: quoteTotalUnitPrice(visibleQuote)
    };
  }

  const fallbackQuote = active.sort(compareByTotalPriceDesc)[0];

  return {
    advertencia: fallbackWarning,
    cotizacion: fallbackQuote,
    origen: "fallback_general",
    precio: quoteTotalUnitPrice(fallbackQuote)
  };
}

export function resolveManualClientPrice(
  precio: number,
  cotizacion: QuoteWithProvider | null = null
): ResolvedClientPrice {
  return {
    advertencia: null,
    cotizacion,
    origen: "override_manual",
    precio: assertNonNegative(precio, "precio_cliente_actual")
  };
}

function activeQuotes(quotes: QuoteWithProvider[], today: Date) {
  return quotes.filter(
    (quote) =>
      quote.estado === "activo" &&
      quote.proveedor?.estado !== "inactivo" &&
      isQuoteCurrentlyValid(quote, today)
  );
}

function isQuoteCurrentlyValid(
  quote: Pick<QuoteWithProvider, "vigente_desde" | "vigente_hasta">,
  today: Date
) {
  const currentDate = dateOnlyValue(today);
  const validFrom = quote.vigente_desde ? dateOnlyValue(quote.vigente_desde) : null;
  const validUntil = quote.vigente_hasta ? dateOnlyValue(quote.vigente_hasta) : null;

  return (
    (validFrom === null || validFrom <= currentDate) &&
    (validUntil === null || validUntil >= currentDate)
  );
}

function compareByTotalPriceDesc(first: QuoteWithProvider, second: QuoteWithProvider) {
  const priceDiff = quoteTotalUnitPrice(second) - quoteTotalUnitPrice(first);

  if (priceDiff !== 0) {
    return priceDiff;
  }

  return compareQuoteDates(second, first);
}

function compareQuoteDates(first: QuoteWithProvider, second: QuoteWithProvider) {
  return dateValue(first.fecha_cotizacion || first.updated_at || first.created_at) -
    dateValue(second.fecha_cotizacion || second.updated_at || second.created_at);
}

function dateValue(value?: string | null) {
  return value ? new Date(value).getTime() || 0 : 0;
}

function dateOnlyValue(value: Date | string) {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);

  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function assertNonNegative(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${fieldName} debe ser un numero no negativo.`);
  }

  return value;
}
