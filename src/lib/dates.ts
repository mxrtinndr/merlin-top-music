import { TIME_ZONE } from "./config";

/** Fecha de hoy (YYYY-MM-DD) en la zona horaria del equipo. */
export function todayISO(now: Date = new Date()): string {
  // en-CA formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Interpreta una fecha ISO como medianoche UTC para operar sin sorpresas de zona horaria. */
function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

export function isISODate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Lunes de la semana de la fecha dada. */
export function startOfWeekISO(iso: string): string {
  const date = parseISODate(iso);
  const weekday = (date.getUTCDay() + 6) % 7; // 0 = lunes
  date.setUTCDate(date.getUTCDate() - weekday);
  return toISODate(date);
}

/** Primer día del mes que queda `months` meses antes (negativo) o después. */
export function addMonthsISO(monthStart: string, months: number): string {
  const date = parseISODate(monthStart);
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  return toISODate(date);
}

/** Días que tiene el mes de la fecha dada. */
export function daysInMonth(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 0 = lunes … 6 = domingo. */
export function weekdayIndex(iso: string): number {
  return (parseISODate(iso).getUTCDay() + 6) % 7;
}

/** Lunes a viernes: la canción del día solo se pone en días laborables. */
export function isWorkday(iso: string): boolean {
  return weekdayIndex(iso) < 5;
}

/** Siguiente día laborable tras la fecha dada: después del viernes va el lunes. */
export function nextWorkdayISO(iso: string): string {
  let date = addDaysISO(iso, 1);
  while (!isWorkday(date)) date = addDaysISO(date, 1);
  return date;
}

export function startOfMonthISO(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

function format(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", ...options }).format(
    parseISODate(iso),
  );
}

/** "miércoles, 24 de septiembre" */
export function formatLongDate(iso: string): string {
  return format(iso, { weekday: "long", day: "numeric", month: "long" });
}

/** Cuándo cae una fecha vista desde otra: "hoy", "mañana" o "el lunes". */
export function relativeDayLabel(iso: string, from: string): string {
  if (iso === from) return "hoy";
  if (iso === addDaysISO(from, 1)) return "mañana";
  return `el ${format(iso, { weekday: "long" })}`;
}

/** "24 sept 2026" */
export function formatShortDate(iso: string): string {
  return format(iso, { day: "numeric", month: "short", year: "numeric" });
}

/** "septiembre de 2026" */
export function formatMonth(iso: string): string {
  return format(iso, { month: "long", year: "numeric" });
}

/** "mié 24" */
export function formatDayBadge(iso: string): { weekday: string; day: string } {
  return {
    weekday: format(iso, { weekday: "short" }).replace(".", ""),
    day: format(iso, { day: "numeric" }),
  };
}
