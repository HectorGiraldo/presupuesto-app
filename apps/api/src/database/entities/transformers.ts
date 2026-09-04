import { ValueTransformer } from 'typeorm';

/**
 * Postgres devuelve `bigint` como string para no perder precisión en JS.
 * Como los importes van en céntimos enteros y jamás se acercan a Number.MAX_SAFE_INTEGER,
 * es seguro convertirlos a number al leer. Sin este transformer, los importes llegarían
 * como "1234" y las sumas concatenarían strings en vez de sumar.
 */
export const bigintTransformer: ValueTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null || value === undefined ? value : Number(value)),
};

/** `numeric` para porcentajes de interés (ej. 3.25). Mismo problema de string. */
export const numericTransformer: ValueTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null || value === undefined ? value : Number(value)),
};
