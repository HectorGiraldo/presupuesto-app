/** Tipo de movimiento. El importe siempre se guarda positivo; el signo lo determina este tipo. */
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  /** Traspaso entre cuentas propias: mueve saldo pero NO cuenta como ingreso ni gasto. */
  TRANSFER = 'TRANSFER',
}

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  INVESTMENT = 'INVESTMENT',
}

export enum CategoryKind {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum RecurrenceFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum DebtType {
  MORTGAGE = 'MORTGAGE',
  LOAN = 'LOAN',
  CREDIT_CARD = 'CREDIT_CARD',
  PERSONAL = 'PERSONAL',
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.CHECKING]: 'Cuenta corriente',
  [AccountType.SAVINGS]: 'Cuenta de ahorro',
  [AccountType.CASH]: 'Efectivo',
  [AccountType.CREDIT_CARD]: 'Tarjeta de crédito',
  [AccountType.INVESTMENT]: 'Inversión',
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.INCOME]: 'Ingreso',
  [TransactionType.EXPENSE]: 'Gasto',
  [TransactionType.TRANSFER]: 'Traspaso',
};

export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  [RecurrenceFrequency.WEEKLY]: 'Semanal',
  [RecurrenceFrequency.BIWEEKLY]: 'Quincenal',
  [RecurrenceFrequency.MONTHLY]: 'Mensual',
  [RecurrenceFrequency.QUARTERLY]: 'Trimestral',
  [RecurrenceFrequency.YEARLY]: 'Anual',
};

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  [DebtType.MORTGAGE]: 'Hipoteca',
  [DebtType.LOAN]: 'Préstamo',
  [DebtType.CREDIT_CARD]: 'Tarjeta de crédito',
  [DebtType.PERSONAL]: 'Deuda personal',
};
