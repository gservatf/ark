export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    currency: "PEN",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency"
  }).format(value);
}

export function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}
