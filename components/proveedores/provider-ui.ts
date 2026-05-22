import { formatDisplayDate } from "@/lib/format/date";

export function formatDate(value?: string | null) {
  return formatDisplayDate(value);
}

export function optionalText(value?: string | null) {
  return value?.trim() ? value : "-";
}
