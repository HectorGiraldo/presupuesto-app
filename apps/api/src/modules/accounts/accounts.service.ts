import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionType } from '@presupuesto/shared';
import { Repository } from 'typeorm';
import { AccountEntity, TransactionEntity } from '../../database/entities';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repo: Repository<AccountEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactions: Repository<TransactionEntity>,
  ) {}

  async findAll(userId: string, includeArchived = false): Promise<(AccountEntity & { currentBalanceCents: number })[]> {
    const where = includeArchived ? { userId } : { userId, archived: false };
    const accounts = await this.repo.find({ where, order: { name: 'ASC' } });
    const balances = await this.balancesMap(userId);
    return accounts.map((a) => ({ ...a, currentBalanceCents: balances.get(a.id) ?? a.initialBalanceCents }));
  }

  async findOne(userId: string, id: string): Promise<AccountEntity> {
    const account = await this.repo.findOne({ where: { id, userId } });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    return account;
  }

  create(userId: string, dto: CreateAccountDto): Promise<AccountEntity> {
    return this.repo.save(this.repo.create({ ...dto, userId }));
  }

  async update(userId: string, id: string, dto: UpdateAccountDto): Promise<AccountEntity> {
    const account = await this.findOne(userId, id);
    Object.assign(account, dto);
    return this.repo.save(account);
  }

  async remove(userId: string, id: string): Promise<{ deleted: boolean; archived: boolean }> {
    const account = await this.findOne(userId, id);
    const used = await this.transactions.count({
      where: [{ userId, accountId: id }, { userId, toAccountId: id }],
    });
    if (used > 0) {
      // Igual que con las categorías: archivar preserva el histórico de movimientos.
      account.archived = true;
      await this.repo.save(account);
      return { deleted: false, archived: true };
    }
    await this.repo.remove(account);
    return { deleted: true, archived: false };
  }

  /**
   * Saldo actual = saldo inicial + Σ ingresos - Σ gastos ± traspasos.
   * No se guarda en ninguna columna: se calcula siempre desde los movimientos,
   * así es imposible que el saldo mostrado se desincronice de la realidad.
   */
  async balancesMap(userId: string): Promise<Map<string, number>> {
    const accounts = await this.repo.find({ where: { userId }, select: ['id', 'initialBalanceCents'] });
    const balances = new Map(accounts.map((a) => [a.id, a.initialBalanceCents]));

    const rows = await this.transactions
      .createQueryBuilder('t')
      .select('t.accountId', 'accountId')
      .addSelect('t.toAccountId', 'toAccountId')
      .addSelect('t.type', 'type')
      .addSelect('SUM(t.amountCents)', 'total')
      .where('t.userId = :userId', { userId })
      .groupBy('t.accountId')
      .addGroupBy('t.toAccountId')
      .addGroupBy('t.type')
      .getRawMany<{ accountId: string; toAccountId: string | null; type: TransactionType; total: string }>();

    for (const row of rows) {
      const total = Number(row.total);
      const current = balances.get(row.accountId) ?? 0;
      if (row.type === TransactionType.INCOME) {
        balances.set(row.accountId, current + total);
      } else if (row.type === TransactionType.EXPENSE) {
        balances.set(row.accountId, current - total);
      } else if (row.type === TransactionType.TRANSFER) {
        balances.set(row.accountId, current - total);
        if (row.toAccountId) {
          balances.set(row.toAccountId, (balances.get(row.toAccountId) ?? 0) + total);
        }
      }
    }

    return balances;
  }

  async balanceOf(userId: string, accountId: string): Promise<number> {
    const map = await this.balancesMap(userId);
    return map.get(accountId) ?? 0;
  }

  /** Usado al validar movimientos: comprueba que las dos cuentas de un traspaso existan y sean distintas. */
  async assertExists(userId: string, id: string): Promise<AccountEntity> {
    return this.findOne(userId, id);
  }

  async assertTransferPair(userId: string, fromId: string, toId: string): Promise<void> {
    if (fromId === toId) throw new BadRequestException('La cuenta de origen y destino no pueden ser la misma');
    await this.assertExists(userId, fromId);
    await this.assertExists(userId, toId);
  }
}
