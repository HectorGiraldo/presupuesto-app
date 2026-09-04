import { AccountType, CategoryKind, DebtType, RecurrenceFrequency, TransactionType } from '../enums';
import type {
  Account, AmortizationRow, BudgetLine, Category, Debt, DebtPayment, Goal, GoalContribution,
  RecurringRule, Transaction, User,
} from '../models';
import type { DateOnly } from '../utils/dates';

// ---------- Auth ----------
export interface LoginDto { email: string; password: string; }
export interface RegisterDto { email: string; password: string; name: string; }
export interface AuthResponse { accessToken: string; user: User; }

// ---------- Cuentas ----------
export interface CreateAccountDto {
  name: string;
  type: AccountType;
  initialBalanceCents: number;
  color?: string;
  icon?: string;
}
export type UpdateAccountDto = Partial<CreateAccountDto> & { archived?: boolean };

// ---------- Categorías ----------
export interface CreateCategoryDto {
  name: string;
  kind: CategoryKind;
  parentId?: string | null;
  color?: string;
  icon?: string;
  essential?: boolean;
}
export type UpdateCategoryDto = Partial<CreateCategoryDto> & { archived?: boolean };

// ---------- Movimientos ----------
export interface CreateTransactionDto {
  type: TransactionType;
  accountId: string;
  categoryId?: string | null;
  toAccountId?: string | null;
  amountCents: number;
  date: DateOnly;
  description: string;
  notes?: string | null;
  tags?: string[];
}
export type UpdateTransactionDto = Partial<CreateTransactionDto>;

export interface TransactionQuery {
  from?: DateOnly;
  to?: DateOnly;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type TransactionList = Paginated<Transaction> & {
  /** Totales del filtro completo, no solo de la página visible. */
  totals: { incomeCents: number; expenseCents: number; balanceCents: number };
};

// ---------- Presupuesto ----------
export interface UpsertBudgetLineDto {
  categoryId: string;
  year: number;
  month: number | null;
  plannedCents: number;
  rollover?: boolean;
  notes?: string | null;
}
export interface CopyBudgetDto { fromYear: number; fromMonth: number; toYear: number; toMonth: number; }

/** Una categoría dentro del presupuesto del mes, con lo planificado frente a lo real. */
export interface BudgetProgressLine {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  essential: boolean;
  plannedCents: number;
  actualCents: number;
  /** planned - actual. Negativo = te has pasado. */
  differenceCents: number;
  percentUsed: number;
  status: 'ok' | 'warning' | 'exceeded' | 'unbudgeted';
}

export interface BudgetProgress {
  year: number;
  month: number;
  lines: BudgetProgressLine[];
  totalPlannedCents: number;
  totalActualCents: number;
  totalIncomeCents: number;
  /** Ingresos reales - gastos reales del mes. */
  availableCents: number;
}

// ---------- Recurrentes ----------
export interface CreateRecurringRuleDto {
  type: TransactionType;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  amountCents: number;
  description: string;
  frequency: RecurrenceFrequency;
  dayOfMonth?: number | null;
  startDate: DateOnly;
  endDate?: DateOnly | null;
  autoGenerate?: boolean;
}
export type UpdateRecurringRuleDto = Partial<CreateRecurringRuleDto> & { active?: boolean };

export interface PendingRecurring {
  ruleId: string;
  description: string;
  amountCents: number;
  type: TransactionType;
  dueDate: DateOnly;
  categoryName: string | null;
  accountName: string;
  daysOverdue: number;
}

// ---------- Metas ----------
export interface CreateGoalDto {
  name: string;
  targetCents: number;
  targetDate?: DateOnly | null;
  accountId?: string | null;
  color?: string;
  icon?: string;
}
export type UpdateGoalDto = Partial<CreateGoalDto> & { archived?: boolean };
export interface CreateContributionDto { amountCents: number; date: DateOnly; notes?: string | null; }

// ---------- Deudas ----------
export interface CreateDebtDto {
  name: string;
  type: DebtType;
  principalCents: number;
  currentBalanceCents?: number;
  interestRate: number;
  monthlyPaymentCents: number;
  startDate: DateOnly;
  termMonths?: number | null;
  accountId?: string | null;
}
export type UpdateDebtDto = Partial<CreateDebtDto> & { archived?: boolean };
export interface CreateDebtPaymentDto {
  amountCents: number;
  date: DateOnly;
  notes?: string | null;
  /** Si no se indican, se calcula el reparto capital/intereses con el TIN. */
  principalCents?: number;
  interestCents?: number;
}
export interface AmortizationSchedule {
  rows: AmortizationRow[];
  totalInterestCents: number;
  totalPaidCents: number;
  payoffDate: DateOnly | null;
}

// ---------- Reportes ----------
export interface CategoryAmount {
  categoryId: string | null;
  categoryName: string;
  color: string;
  icon: string;
  amountCents: number;
  percentage: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  /** (ingresos - gastos) / ingresos, en %. El número que de verdad mide si mejoras. */
  savingsRate: number;
  topExpenseCategories: CategoryAmount[];
  incomeByCategory: CategoryAmount[];
  transactionCount: number;
  /** Mismo mes del periodo anterior, para comparar. */
  previousMonth?: { incomeCents: number; expenseCents: number; balanceCents: number };
}

/** Matriz 12 meses × categorías para la vista anual. */
export interface AnnualSummary {
  year: number;
  months: {
    month: number;
    incomeCents: number;
    expenseCents: number;
    balanceCents: number;
  }[];
  categories: {
    categoryId: string;
    categoryName: string;
    kind: CategoryKind;
    color: string;
    /** 12 posiciones, índice 0 = enero. */
    monthlyCents: number[];
    totalCents: number;
    averageCents: number;
  }[];
  totalIncomeCents: number;
  totalExpenseCents: number;
  totalBalanceCents: number;
  savingsRate: number;
  /** Proyección de cierre de año a partir de la media de los meses ya cerrados. */
  projectedBalanceCents: number;
}

export interface CategoryTrend {
  categoryId: string;
  categoryName: string;
  points: { year: number; month: number; amountCents: number }[];
  averageCents: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CashflowPoint {
  date: DateOnly;
  incomeCents: number;
  expenseCents: number;
  /** Patrimonio acumulado hasta esa fecha. */
  netWorthCents: number;
}

/** Regla 50/30/20 aplicada con el flag `essential` de cada categoría. */
export interface EssentialsSplit {
  incomeCents: number;
  essentialCents: number;
  discretionaryCents: number;
  savedCents: number;
  essentialPercent: number;
  discretionaryPercent: number;
  savedPercent: number;
}

// ---------- Copia de seguridad ----------
/**
 * Volcado completo de los datos del usuario. `id` y `userId` se conservan
 * para que las relaciones (categoría padre, cuenta de una regla recurrente...)
 * sigan intactas al restaurar; el backend siempre reescribe `userId` al del
 * usuario que hace la importación, nunca confía en el valor del fichero.
 */
export interface BackupPayload {
  version: 1;
  exportedAt: string;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgetLines: BudgetLine[];
  recurringRules: RecurringRule[];
  goals: Goal[];
  goalContributions: GoalContribution[];
  debts: Debt[];
  debtPayments: DebtPayment[];
}

export interface DashboardSummary {
  totalBalanceCents: number;
  month: MonthlySummary;
  budget: BudgetProgress | null;
  pendingRecurring: PendingRecurring[];
  accounts: { id: string; name: string; color: string; icon: string; balanceCents: number }[];
}
