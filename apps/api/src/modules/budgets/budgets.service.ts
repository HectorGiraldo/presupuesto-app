import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryKind, TransactionType } from '@presupuesto/shared';
import type { BudgetProgress, BudgetProgressLine } from '@presupuesto/shared';
import { Repository } from 'typeorm';
import {
  BudgetLineEntity, CategoryEntity, TransactionEntity,
} from '../../database/entities';
import { CategoriesService } from '../categories/categories.service';
import { CopyBudgetDto, UpsertBudgetLineDto } from './dto/budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(BudgetLineEntity)
    private readonly repo: Repository<BudgetLineEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactions: Repository<TransactionEntity>,
    private readonly categories: CategoriesService,
  ) {}

  async findAll(userId: string, year: number, month: number | null): Promise<BudgetLineEntity[]> {
    return this.repo.find({
      where: { userId, year, month: month ?? undefined },
      relations: ['category'],
      order: { createdAt: 'ASC' },
    });
  }

  /** Upsert por (userId, categoryId, year, month): un solo objetivo por periodo, sin duplicados. */
  async upsert(userId: string, dto: UpsertBudgetLineDto): Promise<BudgetLineEntity> {
    const category = await this.categories.assertBelongsTo(userId, dto.categoryId, CategoryKind.EXPENSE);
    if (category.parentId === null && (await this.hasChildren(userId, category.id))) {
      // Presupuestar la categoría padre Y sus hijas duplicaría el gasto real al sumar
      // (el movimiento solo pertenece a una de las dos). Se presupuesta a un único nivel.
      throw new BadRequestException(
        `"${category.name}" tiene subcategorías: presupuesta cada subcategoría por separado`,
      );
    }

    const existing = await this.repo.findOne({
      where: { userId, categoryId: dto.categoryId, year: dto.year, month: dto.month ?? undefined },
    });

    if (existing) {
      Object.assign(existing, dto);
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create({ ...dto, userId, month: dto.month ?? null }));
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.repo.delete({ id, userId });
  }

  private async hasChildren(userId: string, categoryId: string): Promise<boolean> {
    return (await this.repo.manager.getRepository(CategoryEntity).count({ where: { userId, parentId: categoryId } })) > 0;
  }

  /** Copia todas las líneas mensuales de un periodo a otro (sobrescribe si ya existen). */
  async copyFromPrevious(userId: string, dto: CopyBudgetDto): Promise<BudgetLineEntity[]> {
    const source = await this.repo.find({
      where: { userId, year: dto.fromYear, month: dto.fromMonth },
    });
    const results: BudgetLineEntity[] = [];
    for (const line of source) {
      results.push(await this.upsert(userId, {
        categoryId: line.categoryId,
        year: dto.toYear,
        month: dto.toMonth,
        plannedCents: line.plannedCents,
        rollover: line.rollover,
        notes: line.notes,
      }));
    }
    return results;
  }

  /**
   * Compara lo planificado con lo real del mes. Las líneas anuales (month=null) se
   * prorratean entre 12 para poder mostrarlas junto a las mensuales sin falsear el total.
   */
  async monthlyProgress(userId: string, year: number, month: number): Promise<BudgetProgress> {
    const [monthLines, annualLinesRaw] = await Promise.all([
      this.repo.find({ where: { userId, year, month }, relations: ['category'] }),
      this.repo.find({ where: { userId, year }, relations: ['category'] }),
    ]);
    const annualLines = annualLinesRaw.filter((r) => r.month === null);

    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const to = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;

    const actualRows = await this.transactions.createQueryBuilder('t')
      .select('t.categoryId', 'categoryId')
      .addSelect('SUM(t.amountCents)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.type = :type', { type: TransactionType.EXPENSE })
      .andWhere('t.date BETWEEN :from AND :to', { from, to })
      .groupBy('t.categoryId')
      .getRawMany<{ categoryId: string; total: string }>();
    const actualByCategory = new Map(actualRows.map((r) => [r.categoryId, Number(r.total)]));

    const incomeRow = await this.transactions.createQueryBuilder('t')
      .select('SUM(t.amountCents)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.type = :type', { type: TransactionType.INCOME })
      .andWhere('t.date BETWEEN :from AND :to', { from, to })
      .getRawOne<{ total: string | null }>();
    const totalIncomeCents = Number(incomeRow?.total ?? 0);

    const byCategory = new Map<string, { line: BudgetLineEntity | null; plannedCents: number }>();
    for (const line of monthLines) {
      byCategory.set(line.categoryId, { line, plannedCents: line.plannedCents });
    }
    for (const line of annualLines) {
      const prorated = Math.round(line.plannedCents / 12);
      const existing = byCategory.get(line.categoryId);
      if (existing) existing.plannedCents += prorated;
      else byCategory.set(line.categoryId, { line, plannedCents: prorated });
    }
    // Categorías con gasto real pero sin línea de presupuesto: se muestran igualmente
    // como "sin presupuestar", porque también es información útil para decidir.
    for (const categoryId of actualByCategory.keys()) {
      if (!byCategory.has(categoryId)) {
        byCategory.set(categoryId, { line: null, plannedCents: 0 });
      }
    }

    const categoryCache = new Map<string, CategoryEntity>();
    const resolveCategory = async (id: string, fallback?: CategoryEntity | null): Promise<CategoryEntity> => {
      if (fallback) return fallback;
      if (categoryCache.has(id)) return categoryCache.get(id)!;
      const cat = await this.categories.findOne(userId, id);
      categoryCache.set(id, cat);
      return cat;
    };

    const lines: BudgetProgressLine[] = [];
    for (const [categoryId, { line, plannedCents }] of byCategory) {
      const category = await resolveCategory(categoryId, line?.category);
      const actualCents = actualByCategory.get(categoryId) ?? 0;
      const differenceCents = plannedCents - actualCents;
      const percentUsed = plannedCents > 0 ? Math.round((actualCents / plannedCents) * 100) : (actualCents > 0 ? 100 : 0);

      let status: BudgetProgressLine['status'];
      if (plannedCents === 0) status = 'unbudgeted';
      else if (percentUsed > 100) status = 'exceeded';
      else if (percentUsed >= 80) status = 'warning';
      else status = 'ok';

      lines.push({
        categoryId, categoryName: category.name, color: category.color, icon: category.icon,
        essential: category.essential, plannedCents, actualCents, differenceCents, percentUsed, status,
      });
    }

    lines.sort((a, b) => b.actualCents - a.actualCents);

    const totalPlannedCents = lines.reduce((sum, l) => sum + l.plannedCents, 0);
    const totalActualCents = lines.reduce((sum, l) => sum + l.actualCents, 0);

    return {
      year, month, lines, totalPlannedCents, totalActualCents,
      totalIncomeCents,
      availableCents: totalIncomeCents - totalActualCents,
    };
  }
}
