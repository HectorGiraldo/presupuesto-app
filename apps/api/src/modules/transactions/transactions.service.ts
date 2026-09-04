import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryKind, TransactionType } from '@presupuesto/shared';
import type { TransactionList } from '@presupuesto/shared';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { TransactionEntity } from '../../database/entities';
import { AccountsService } from '../accounts/accounts.service';
import { CategoriesService } from '../categories/categories.service';
import { CreateTransactionDto, TransactionQueryDto, UpdateTransactionDto } from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repo: Repository<TransactionEntity>,
    private readonly accounts: AccountsService,
    private readonly categories: CategoriesService,
  ) {}

  /**
   * Reglas de forma de un movimiento, iguales en alta y edición:
   * - traspaso: cuenta origen != destino, SIN categoría.
   * - ingreso/gasto: categoría obligatoria y del tipo correcto, SIN cuenta destino.
   */
  private async validateShape(
    userId: string,
    type: TransactionType,
    accountId: string,
    categoryId: string | null | undefined,
    toAccountId: string | null | undefined,
  ): Promise<void> {
    await this.accounts.assertExists(userId, accountId);

    if (type === TransactionType.TRANSFER) {
      if (!toAccountId) throw new BadRequestException('Un traspaso necesita cuenta de destino');
      if (categoryId) throw new BadRequestException('Un traspaso no lleva categoría');
      await this.accounts.assertTransferPair(userId, accountId, toAccountId);
      return;
    }

    if (toAccountId) throw new BadRequestException('Solo los traspasos llevan cuenta de destino');
    if (!categoryId) throw new BadRequestException('Los ingresos y gastos necesitan categoría');
    const kind = type === TransactionType.INCOME ? CategoryKind.INCOME : CategoryKind.EXPENSE;
    await this.categories.assertBelongsTo(userId, categoryId, kind);
  }

  async create(userId: string, dto: CreateTransactionDto): Promise<TransactionEntity> {
    await this.validateShape(userId, dto.type, dto.accountId, dto.categoryId, dto.toAccountId);
    const entity = this.repo.create({
      ...dto,
      userId,
      categoryId: dto.type === TransactionType.TRANSFER ? null : (dto.categoryId ?? null),
      toAccountId: dto.type === TransactionType.TRANSFER ? dto.toAccountId ?? null : null,
      tags: dto.tags ?? [],
    });
    const saved = await this.repo.save(entity);
    return this.findOne(userId, saved.id);
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto): Promise<TransactionEntity> {
    const existing = await this.findOne(userId, id);
    const merged = { ...existing, ...dto };
    await this.validateShape(userId, merged.type, merged.accountId, merged.categoryId, merged.toAccountId);

    if (merged.type === TransactionType.TRANSFER) {
      merged.categoryId = null;
    } else {
      merged.toAccountId = null;
    }

    await this.repo.save({ id, ...dto, categoryId: merged.categoryId, toAccountId: merged.toAccountId });
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.findOne(userId, id);
    await this.repo.remove(existing);
  }

  async findOne(userId: string, id: string): Promise<TransactionEntity> {
    const tx = await this.repo.findOne({
      where: { id, userId },
      relations: ['account', 'toAccount', 'category'],
    });
    if (!tx) throw new NotFoundException('Movimiento no encontrado');
    return tx;
  }

  async findAll(userId: string, query: TransactionQueryDto): Promise<TransactionList> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize ?? 50;

    const qb = this.repo.createQueryBuilder('t')
      .leftJoinAndSelect('t.account', 'account')
      .leftJoinAndSelect('t.toAccount', 'toAccount')
      .leftJoinAndSelect('t.category', 'category')
      .where('t.userId = :userId', { userId });

    this.applyFilters(qb, query);

    const totalsRow = await qb.clone()
      .select('t.type', 'type')
      .addSelect('SUM(t.amountCents)', 'total')
      .groupBy('t.type')
      .getRawMany<{ type: TransactionType; total: string }>();

    const totals = { incomeCents: 0, expenseCents: 0, balanceCents: 0 };
    for (const row of totalsRow) {
      const amount = Number(row.total);
      if (row.type === TransactionType.INCOME) totals.incomeCents = amount;
      if (row.type === TransactionType.EXPENSE) totals.expenseCents = amount;
    }
    totals.balanceCents = totals.incomeCents - totals.expenseCents;

    const [items, total] = await qb
      .orderBy('t.date', 'DESC')
      .addOrderBy('t.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items as any,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      totals,
    };
  }

  private applyFilters(
    qb: SelectQueryBuilder<TransactionEntity>,
    query: TransactionQueryDto,
  ): void {
    if (query.from) qb.andWhere('t.date >= :from', { from: query.from });
    if (query.to) qb.andWhere('t.date <= :to', { to: query.to });
    if (query.accountId) {
      qb.andWhere(new Brackets((b) => {
        b.where('t.accountId = :accountId', { accountId: query.accountId })
          .orWhere('t.toAccountId = :accountId', { accountId: query.accountId });
      }));
    }
    if (query.categoryId) qb.andWhere('t.categoryId = :categoryId', { categoryId: query.categoryId });
    if (query.type) qb.andWhere('t.type = :type', { type: query.type });
    if (query.search) {
      qb.andWhere(
        new Brackets((b) => {
          b.where('t.description ILIKE :search', { search: `%${query.search}%` })
            .orWhere('t.notes ILIKE :search', { search: `%${query.search}%` });
        }),
      );
    }
  }
}
