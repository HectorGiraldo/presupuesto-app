import {
  AccountType, CategoryKind, DebtType, RecurrenceFrequency, TransactionType,
} from '../enums';
import type { DateOnly } from '../utils/dates';

export interface User {
  id: string;
  email: string;
  name: string;
  currency: string;
  locale: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalanceCents: number;
  color: string;
  icon: string;
  archived: boolean;
  /** Calculado por el backend: saldo inicial + Σ movimientos. No se almacena. */
  currentBalanceCents?: number;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  parentId: string | null;
  color: string;
  icon: string;
  /** Gasto imprescindible (vivienda, comida) vs. prescindible (ocio). Alimenta el 50/30/20. */
  essential: boolean;
  archived: boolean;
  children?: Category[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  accountId: string;
  /** null en traspasos. */
  categoryId: string | null;
  /** Solo en traspasos: cuenta de destino. */
  toAccountId: string | null;
  /** Siempre positivo. El signo lo determina `type`. */
  amountCents: number;
  date: DateOnly;
  description: string;
  notes: string | null;
  tags: string[];
  recurringRuleId: string | null;
  createdAt: string;
  // Datos denormalizados que el backend adjunta para pintar listas sin N+1 peticiones.
  account?: Pick<Account, 'id' | 'name' | 'color' | 'icon'>;
  toAccount?: Pick<Account, 'id' | 'name' | 'color' | 'icon'>;
  category?: Pick<Category, 'id' | 'name' | 'color' | 'icon' | 'kind'>;
}

export interface BudgetLine {
  id: string;
  categoryId: string;
  year: number;
  /** null = objetivo ANUAL (para gastos estacionales: IBI, seguro del coche, vacaciones). */
  month: number | null;
  plannedCents: number;
  /** Si sobra presupuesto, arrastrarlo al mes siguiente. */
  rollover: boolean;
  notes: string | null;
  category?: Category;
}

export interface RecurringRule {
  id: string;
  type: TransactionType;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  amountCents: number;
  description: string;
  frequency: RecurrenceFrequency;
  /** Día del mes (1-31) para frecuencias mensuales o superiores. */
  dayOfMonth: number | null;
  startDate: DateOnly;
  endDate: DateOnly | null;
  active: boolean;
  /** true = crea el movimiento solo; false = solo avisa para confirmarlo a mano. */
  autoGenerate: boolean;
  lastGeneratedDate: DateOnly | null;
  account?: Pick<Account, 'id' | 'name'>;
  category?: Pick<Category, 'id' | 'name' | 'color' | 'icon'>;
  /** Calculado: próxima fecha en la que toca. */
  nextDate?: DateOnly;
}

export interface Goal {
  id: string;
  name: string;
  targetCents: number;
  savedCents: number;
  targetDate: DateOnly | null;
  accountId: string | null;
  color: string;
  icon: string;
  archived: boolean;
  // Calculados por el backend.
  progressPercent?: number;
  remainingCents?: number;
  /** Cuánto habría que apartar cada mes para llegar a la fecha objetivo. */
  monthlyNeededCents?: number;
  monthsRemaining?: number;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amountCents: number;
  date: DateOnly;
  notes: string | null;
}

export interface Debt {
  id: string;
  name: string;
  type: DebtType;
  principalCents: number;
  currentBalanceCents: number;
  /** TIN anual en porcentaje, ej. 3.25 */
  interestRate: number;
  monthlyPaymentCents: number;
  startDate: DateOnly;
  termMonths: number | null;
  accountId: string | null;
  archived: boolean;
  // Calculados.
  paidCents?: number;
  progressPercent?: number;
  remainingMonths?: number;
  totalInterestCents?: number;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amountCents: number;
  principalCents: number;
  interestCents: number;
  date: DateOnly;
  notes: string | null;
}

/** Una fila del cuadro de amortización (sistema francés). */
export interface AmortizationRow {
  number: number;
  date: DateOnly;
  paymentCents: number;
  principalCents: number;
  interestCents: number;
  remainingCents: number;
}
