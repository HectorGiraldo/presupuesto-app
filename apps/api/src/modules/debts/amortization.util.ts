import { addMonths } from '@presupuesto/shared';
import type { AmortizationRow, AmortizationSchedule } from '@presupuesto/shared';

/**
 * Cuadro de amortización con sistema francés (cuota fija, estándar en España):
 * cada cuota se reparte en intereses (sobre el saldo pendiente) y capital (el resto).
 */
export function buildAmortizationSchedule(
  principalCents: number,
  annualRatePercent: number,
  monthlyPaymentCents: number,
  startDate: string,
  termMonths?: number | null,
): AmortizationSchedule {
  const monthlyRate = annualRatePercent / 100 / 12;
  const rows: AmortizationRow[] = [];
  let balance = principalCents;
  let date = startDate;
  // Límite de seguridad: si la cuota no cubre ni los intereses, el saldo nunca bajaría
  // y el bucle sería infinito. 600 meses = 50 años, más que cualquier hipoteca real.
  const maxRows = termMonths && termMonths > 0 ? termMonths : 600;

  for (let i = 1; i <= maxRows && balance > 0; i += 1) {
    const interestCents = Math.round(balance * monthlyRate);
    let principalPortion = monthlyPaymentCents - interestCents;
    let payment = monthlyPaymentCents;

    if (principalPortion <= 0) {
      // La cuota no llega a cubrir los intereses: el saldo no baja nunca. Se corta aquí
      // en vez de generar un cuadro infinito o con saldo creciente.
      break;
    }
    if (principalPortion >= balance) {
      // Última cuota: se ajusta para no dejar el saldo en negativo.
      principalPortion = balance;
      payment = interestCents + principalPortion;
    }

    balance -= principalPortion;
    rows.push({
      number: i, date, paymentCents: payment, principalCents: principalPortion,
      interestCents, remainingCents: balance,
    });
    date = addMonths(date, 1);
  }

  return {
    rows,
    totalInterestCents: rows.reduce((sum, r) => sum + r.interestCents, 0),
    totalPaidCents: rows.reduce((sum, r) => sum + r.paymentCents, 0),
    payoffDate: rows.length ? rows[rows.length - 1].date : null,
  };
}
