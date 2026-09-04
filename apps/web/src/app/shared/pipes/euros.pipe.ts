import { Pipe, PipeTransform } from '@angular/core';
import { formatCents } from '@presupuesto/shared';

/** {{ amountCents | euros }} -> "1.234,56 €". Reutiliza el formateador del paquete compartido
 *  para que el signo y el formato sean exactamente los mismos que calcula el backend. */
@Pipe({ name: 'euros' })
export class EurosPipe implements PipeTransform {
  transform(cents: number | null | undefined, opts: { decimals?: boolean; sign?: boolean } = {}): string {
    if (cents === null || cents === undefined) return '—';
    return formatCents(cents, opts);
  }
}
