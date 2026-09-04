/**
 * Todo el dinero viaja y se almacena como ENTEROS DE CÉNTIMOS.
 * Nunca uses `number` decimal para importes: 0.1 + 0.2 !== 0.3 en coma flotante,
 * y en una app de finanzas eso significa cifras mal sin que nada avise.
 */

/** 12,34 € -> 1234 */
export function toCents(euros: number): number {
  return Math.round(euros * 100);
}

/** 1234 -> 12.34 (solo para mostrar o para inputs) */
export function toEuros(cents: number): number {
  return cents / 100;
}

/** 1234 -> "12,34 €" con formato español. */
export function formatCents(cents: number, opts: { decimals?: boolean; sign?: boolean } = {}): string {
  const { decimals = true, sign = false } = opts;
  const value = cents / 100;
  const formatted = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(value);
  return sign && cents > 0 ? `+${formatted}` : formatted;
}

/**
 * Interpreta lo que el usuario escribe en un input de importe con convenciones españolas:
 * "1.234,56" -> 123456 | "1234,56" -> 123456 | "1234.56" -> 123456 | "1.234" -> 123400
 */
export function parseAmountToCents(input: string): number | null {
  if (!input) return null;
  let s = String(input).trim().replace(/[€\s]/g, '');
  if (!s) return null;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    // "1.234,56" -> el último separador es el decimal
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (hasComma) {
    s = s.replace(',', '.');
  } else if (hasDot) {
    // "1.234" con 3 dígitos tras el punto es separador de miles, no decimal
    const parts = s.split('.');
    if (parts.length > 2 || parts[1]?.length === 3) s = parts.join('');
  }

  const value = Number(s);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

/** Divide un importe en n partes exactas: los céntimos sobrantes se reparten en las primeras. */
export function splitCents(cents: number, parts: number): number[] {
  const base = Math.floor(cents / parts);
  const remainder = cents - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** Porcentaje de `part` sobre `total`, acotado y a salvo de dividir por cero. */
export function percentage(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}
