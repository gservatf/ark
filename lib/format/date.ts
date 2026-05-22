export function formatDisplayDate(value?: string | null) {
  const date = parseDate(value);

  if (!date) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function parseDate(value?: string | null) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  const date = new Date(isDateOnly(trimmedValue) ? `${trimmedValue}T00:00:00` : trimmedValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
