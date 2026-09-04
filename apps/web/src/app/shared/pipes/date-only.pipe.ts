import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@presupuesto/shared';

/** {{ '2026-09-04' | dateOnly }} -> "04/09/2026". Nunca usar el DatePipe de Angular
 *  con estas fechas: interpretaría el string como UTC y podría desplazar el día. */
@Pipe({ name: 'dateOnly' })
export class DateOnlyPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    return formatDate(value);
  }
}
