import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CategoryKind, TransactionType, endOfMonth, endOfYear, percentage, startOfMonth, startOfYear,
} from '@presupuesto/shared';
import type {
  AnnualSummary, CashflowPoint, CategoryAmount, CategoryTrend, EssentialsSplit, MonthlySummary,
} from '@presupuesto/shared';
import { Repository } from 'typeorm';
import { AccountEntity, CategoryEntity, TransactionEntity } from '../../database/entities';

interface TypeTotalRow { type: TransactionType; total: string; }
interface CategoryTotalRow { categoryId: string | null; total: string; }

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactions: Repository<TransactionEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categories: Repository<CategoryEntity>,
    @InjectRepository(AccountEntity)
    private readonly accounts: Repository<AccountEntity>,
  ) {}

  private async totalsByType(userId: string, from: string, to: string): Promise<{ income: number; expense: number }> {
    const rows = await this.transactions.createQueryBuilder('t')
      .select('t.type', 'type').addSelect('SUM(t.amountCents)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date BETWEEN :from AND :to', { from, to })
      .andWhere('t.type != :transfer', { transfer: TransactionType.TRANSFER })
      .groupBy('t.type')
      .getRawMany<TypeTotalRow>();
    const income = Number(rows.find((r) => r.type === TransactionType.INCOME)?.total ?? 0);
    const expense = Number(rows.find((r) => r.type === TransactionType.EXPENSE)?.total ?? 0);
    return { income, expense };
  }

  private async byCategory(
    userId: string, type: TransactionType, from: string, to: string, limit?: number,
  ): Promise<CategoryAmount[]> {
    const rows = await this.transactions.createQueryBuilder('t')
      .select('t.categoryId', 'categoryId').addSelect('SUM(t.amountCents)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.type = :type', { type })
      .andWhere('t.date BETWEEN :from AND :to', { from, to })
      .groupBy('t.categoryId')
      .orderBy('total', 'DESC')
      .getRawMany<CategoryTotalRow>();

    const total = rows.reduce((sum, r) => sum + Number(r.total), 0);
    const categoryIds = rows.map((r) => r.categoryId).filter((id): id is string => !!id);
    const categories = categoryIds.length
      ? await this.categories.find({ where: categoryIds.map((id) => ({ id })) })
      : [];
    const byId = new Map(categories.map((c) => [c.id, c]));

    const limited = limit ? rows.slice(0, limit) : rows;
    return limited.map((r) => {
      const amountCents = Number(r.total);
      const cat = r.categoryId ? byId.get(r.categoryId) : undefined;
      return {
        categoryId: r.categoryId,
        categoryName: cat?.name ?? 'Sin categoría',
        color: cat?.color ?? '#94a3b8',
        icon: cat?.icon ?? 'help-circle',
        amountCents,
        percentage: percentage(amountCents, total),
      };
    });
  }

  async monthlySummary(userId: string, year: number, month: number): Promise<MonthlySummary> {
    const from = startOfMonth(year, month);
    const to = endOfMonth(year, month);
    const { income, expense } = await this.totalsByType(userId, from, to);

    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevFrom = startOfMonth(prevYear, prevMonth);
    const prevTo = endOfMonth(prevYear, prevMonth);
    const previous = await this.totalsByType(userId, prevFrom, prevTo);

    const transactionCount = await this.transactions.createQueryBuilder('t')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date BETWEEN :from AND :to', { from, to })
      .getCount();

    const [topExpenseCategories, incomeByCategory] = await Promise.all([
      this.byCategory(userId, TransactionType.EXPENSE, from, to, 5),
      this.byCategory(userId, TransactionType.INCOME, from, to),
    ]);

    return {
      year, month, incomeCents: income, expenseCents: expense, balanceCents: income - expense,
      savingsRate: percentage(income - expense, income),
      topExpenseCategories, incomeByCategory, transactionCount,
      previousMonth: {
        incomeCents: previous.income, expenseCents: previous.expense,
        balanceCents: previous.income - previous.expense,
      },
    };
  }

  async annualSummary(userId: string, year: number): Promise<AnnualSummary> {
    const from = startOfYear(year);
    const to = endOfYear(year);

    const monthlyRows = await this.transactions.createQueryBuilder('t')
      .select('EXTRACT(MONTH FROM t.date)', 'month')
      .addSelect('t.type', 'type')
      .addSelect('SUM(t.amountCents)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date BETWEEN :from AND :to', { from, to })
      .andWhere('t.type != :transfer', { transfer: TransactionType.TRANSFER })
      .groupBy('EXTRACT(MONTH FROM t.date)').addGroupBy('t.type')
      .getRawMany<{ month: string; type: TransactionType; total: string }>();

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1, incomeCents: 0, expenseCents: 0, balanceCents: 0,
    }));
    for (const row of monthlyRows) {
      const idx = Number(row.month) - 1;
      const amount = Number(row.total);
      if (row.type === TransactionType.INCOME) months[idx].incomeCents = amount;
      if (row.type === TransactionType.EXPENSE) months[idx].expenseCents = amount;
    }
    for (const m of months) m.balanceCents = m.incomeCents - m.expenseCents;

    const categoryRows = await this.transactions.createQueryBuilder('t')
      .select('t.categoryId', 'categoryId')
      .addSelect('EXTRACT(MONTH FROM t.date)', 'month')
      .addSelect('SUM(t.amountCents)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date BETWEEN :from AND :to', { from, to })
      .andWhere('t.categoryId IS NOT NULL')
      .groupBy('t.categoryId').addGroupBy('EXTRACT(MONTH FROM t.date)')
      .getRawMany<{ categoryId: string; month: string; total: string }>();

    const categoryIds = [...new Set(categoryRows.map((r) => r.categoryId))];
    const categoryEntities = categoryIds.length
      ? await this.categories.find({ where: categoryIds.map((id) => ({ id })) })
      : [];
    const catById = new Map(categoryEntities.map((c) => [c.id, c]));

    const categoriesMap = new Map<string, number[]>();
    for (const row of categoryRows) {
      if (!categoriesMap.has(row.categoryId)) categoriesMap.set(row.categoryId, Array(12).fill(0));
      categoriesMap.get(row.categoryId)![Number(row.month) - 1] = Number(row.total);
    }

    const categories = [...categoriesMap.entries()]
      .map(([categoryId, monthlyCents]) => {
        const cat = catById.get(categoryId);
        const totalCents = monthlyCents.reduce((s, v) => s + v, 0);
        return {
          categoryId, categoryName: cat?.name ?? 'Sin categoría', kind: cat?.kind ?? CategoryKind.EXPENSE,
          color: cat?.color ?? '#94a3b8', monthlyCents, totalCents, averageCents: Math.round(totalCents / 12),
        };
      })
      .sort((a, b) => b.totalCents - a.totalCents);

    const totalIncomeCents = months.reduce((s, m) => s + m.incomeCents, 0);
    const totalExpenseCents = months.reduce((s, m) => s + m.expenseCents, 0);
    const totalBalanceCents = totalIncomeCents - totalExpenseCents;

    // Proyección: si el año sigue en curso, extrapola la media de los meses con
    // movimientos; si ya terminó, el "proyectado" es simplemente el resultado real.
    const now = new Date();
    const isCurrentYear = now.getFullYear() === year;
    const monthsElapsed = isCurrentYear ? now.getMonth() + 1 : 12;
    const monthsWithData = months.slice(0, monthsElapsed).filter((m) => m.incomeCents > 0 || m.expenseCents > 0).length;
    const projectedBalanceCents = isCurrentYear && monthsWithData > 0
      ? Math.round((totalBalanceCents / monthsWithData) * 12)
      : totalBalanceCents;

    return {
      year, months, categories, totalIncomeCents, totalExpenseCents, totalBalanceCents,
      savingsRate: percentage(totalBalanceCents, totalIncomeCents), projectedBalanceCents,
    };
  }

  async categoryTrend(userId: string, categoryId: string, months = 12): Promise<CategoryTrend> {
    const category = await this.categories.findOne({ where: { id: categoryId, userId } });
    const rows = await this.transactions.createQueryBuilder('t')
      .select("TO_CHAR(t.date, 'YYYY-MM')", 'ym')
      .addSelect('SUM(t.amountCents)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.categoryId = :categoryId', { categoryId })
      .groupBy('ym').orderBy('ym', 'DESC').limit(months)
      .getRawMany<{ ym: string; total: string }>();

    const points = rows.reverse().map((r) => {
      const [y, m] = r.ym.split('-').map(Number);
      return { year: y, month: m, amountCents: Number(r.total) };
    });

    const averageCents = points.length ? Math.round(points.reduce((s, p) => s + p.amountCents, 0) / points.length) : 0;

    let trend: CategoryTrend['trend'] = 'stable';
    if (points.length >= 4) {
      const half = Math.floor(points.length / 2);
      const firstAvg = points.slice(0, half).reduce((s, p) => s + p.amountCents, 0) / half;
      const secondAvg = points.slice(-half).reduce((s, p) => s + p.amountCents, 0) / half;
      const change = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
      if (change > 0.1) trend = 'up';
      else if (change < -0.1) trend = 'down';
    }

    return { categoryId, categoryName: category?.name ?? 'Sin categoría', points, averageCents, trend };
  }

  /**
   * Patrimonio acumulado en el rango. Los traspasos no se incluyen: mueven dinero
   * entre cuentas propias sin cambiar el total, así que sumar solo ingresos/gastos
   * ya da el neto correcto.
   */
  async cashflow(userId: string, from: string, to: string): Promise<CashflowPoint[]> {
    const accountsSum = await this.accounts.createQueryBuilder('a')
      .select('SUM(a.initialBalanceCents)', 'total')
      .where('a.userId = :userId', { userId })
      .getRawOne<{ total: string | null }>();
    const initialBalance = Number(accountsSum?.total ?? 0);

    const priorRow = await this.transactions.createQueryBuilder('t')
      .select('t.type', 'type').addSelect('SUM(t.amountCents)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date < :from', { from })
      .andWhere('t.type != :transfer', { transfer: TransactionType.TRANSFER })
      .groupBy('t.type')
      .getRawMany<TypeTotalRow>();
    const priorIncome = Number(priorRow.find((r) => r.type === TransactionType.INCOME)?.total ?? 0);
    const priorExpense = Number(priorRow.find((r) => r.type === TransactionType.EXPENSE)?.total ?? 0);
    let runningTotal = initialBalance + priorIncome - priorExpense;

    // OJO: seleccionar `t.date` tal cual devuelve un objeto Date del driver de pg
    // (medianoche UTC), y al serializarlo a JSON se desplaza un día según el huso
    // horario del servidor. TO_CHAR fuerza un string "YYYY-MM-DD" sin ese problema.
    const dailyRows = await this.transactions.createQueryBuilder('t')
      .select("TO_CHAR(t.date, 'YYYY-MM-DD')", 'date').addSelect('t.type', 'type').addSelect('SUM(t.amountCents)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date BETWEEN :from AND :to', { from, to })
      .andWhere('t.type != :transfer', { transfer: TransactionType.TRANSFER })
      .groupBy('t.date').addGroupBy('t.type')
      .orderBy('t.date', 'ASC')
      .getRawMany<{ date: string; type: TransactionType; total: string }>();

    const byDate = new Map<string, { incomeCents: number; expenseCents: number }>();
    for (const row of dailyRows) {
      if (!byDate.has(row.date)) byDate.set(row.date, { incomeCents: 0, expenseCents: 0 });
      const entry = byDate.get(row.date)!;
      if (row.type === TransactionType.INCOME) entry.incomeCents = Number(row.total);
      if (row.type === TransactionType.EXPENSE) entry.expenseCents = Number(row.total);
    }

    const points: CashflowPoint[] = [];
    const sortedDates = [...byDate.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    for (const date of sortedDates) {
      const { incomeCents, expenseCents } = byDate.get(date)!;
      runningTotal += incomeCents - expenseCents;
      points.push({ date, incomeCents, expenseCents, netWorthCents: runningTotal });
    }
    return points;
  }

  /** Regla 50/30/20 aplicada con el flag `essential` de cada categoría de gasto. */
  async essentialsSplit(userId: string, year: number, month: number): Promise<EssentialsSplit> {
    const from = startOfMonth(year, month);
    const to = endOfMonth(year, month);
    const { income } = await this.totalsByType(userId, from, to);

    const rows = await this.transactions.createQueryBuilder('t')
      .innerJoin('t.category', 'c')
      .select('c.essential', 'essential').addSelect('SUM(t.amountCents)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.type = :type', { type: TransactionType.EXPENSE })
      .andWhere('t.date BETWEEN :from AND :to', { from, to })
      .groupBy('c.essential')
      .getRawMany<{ essential: boolean; total: string }>();

    const essentialCents = Number(rows.find((r) => r.essential === true)?.total ?? 0);
    const discretionaryCents = Number(rows.find((r) => r.essential === false)?.total ?? 0);
    const savedCents = income - essentialCents - discretionaryCents;

    return {
      incomeCents: income, essentialCents, discretionaryCents, savedCents,
      essentialPercent: percentage(essentialCents, income),
      discretionaryPercent: percentage(discretionaryCents, income),
      savedPercent: percentage(savedCents, income),
    };
  }
}
