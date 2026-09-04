/**
 * Las fechas de los movimientos son SOLO FECHA (`YYYY-MM-DD`), sin hora ni zona horaria.
 * Si se usara `Date`/UTC, un gasto del día 1 a las 00:30 en España aparecería en el mes
 * anterior. Todo lo que cruza la API o la BD como fecha de movimiento es este string.
 */
export type DateOnly = string;

const pad = (n: number) => String(n).padStart(2, '0');

/** Fecha local -> "YYYY-MM-DD" (nunca uses toISOString(): convierte a UTC y puede restar un día). */
export function toDateOnly(date: Date = new Date()): DateOnly {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM-DD" -> Date en medianoche local. */
export function fromDateOnly(value: DateOnly): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(): DateOnly {
  return toDateOnly();
}

/** Primer día del mes: (2026, 9) -> "2026-09-01" */
export function startOfMonth(year: number, month: number): DateOnly {
  return `${year}-${pad(month)}-01`;
}

/** Último día del mes, respetando años bisiestos: (2026, 2) -> "2026-02-28" */
export function endOfMonth(year: number, month: number): DateOnly {
  return `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;
}

export function startOfYear(year: number): DateOnly {
  return `${year}-01-01`;
}

export function endOfYear(year: number): DateOnly {
  return `${year}-12-31`;
}

export function addMonths(value: DateOnly, months: number): DateOnly {
  const d = fromDateOnly(value);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  // Si el día no existe en el mes destino (31 -> febrero), se ajusta al último día.
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return toDateOnly(d);
}

export function addDays(value: DateOnly, days: number): DateOnly {
  const d = fromDateOnly(value);
  d.setDate(d.getDate() + days);
  return toDateOnly(d);
}

/** "2026-09-15" -> "15/09/2026" */
export function formatDate(value: DateOnly): string {
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

export const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const;

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? '';
}

/** Año y mes (1-12) actuales, en hora local. */
export function currentPeriod(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
