/**
 * Rampa secuencial de un solo tono (azul, claro→oscuro) para el mapa de calor
 * anual. Pasos tomados de la paleta validada del sistema de dataviz: cada paso
 * pasa el chequeo de contraste de la skill, así que no hay que recalcularlo.
 */
const SEQUENTIAL_STEPS = [
  '#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec',
  '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab',
  '#184f95', '#104281', '#0d366b',
];

/** A partir del paso 450 (índice 7) el fondo es lo bastante oscuro para necesitar texto blanco. */
const WHITE_TEXT_FROM_INDEX = 7;

export interface HeatCellStyle {
  background: string;
  color: string;
}

/** value/max en [0,1] -> color de fondo + color de texto legible sobre él. */
export function heatColor(value: number, max: number): HeatCellStyle {
  if (max <= 0 || value <= 0) {
    return { background: 'transparent', color: 'var(--color-text-muted)' };
  }
  const ratio = Math.min(1, value / max);
  const index = Math.min(SEQUENTIAL_STEPS.length - 1, Math.floor(ratio * SEQUENTIAL_STEPS.length));
  return {
    background: SEQUENTIAL_STEPS[index],
    color: index >= WHITE_TEXT_FROM_INDEX ? '#ffffff' : '#0b0b0b',
  };
}
