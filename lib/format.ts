const currency = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number): string {
  return currency.format(amount).replace("DOP", "RD$").trim();
}

export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

/** "Octubre 2026" (mes en que fue emitido un recibo). */
export function formatMonthYear(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const text = new Intl.DateTimeFormat("es-DO", { month: "long", year: "numeric" })
    .format(date)
    .replace(/\s+de\s+/i, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "20 oct 2026" */
export function formatDateWithYear(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(/\s+de\s+/i, " ");
}
