/** Fecha local en formato YYYY-MM-DD (evita el desfase de UTC). */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Primer y último día del mes actual + offset (0 = actual, -2 = hace dos meses). */
export function monthRange(offset = 0): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { from: toIsoDate(first), to: toIsoDate(last) };
}

/** Mensual: mes actual. Trimestral: últimos 3 meses incluyendo el actual. */
export function periodRange(period: "mensual" | "trimestral"): { from: string; to: string } {
  if (period === "mensual") return monthRange(0);
  return { from: monthRange(-2).from, to: monthRange(0).to };
}
