import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { BackupPayload } from '@presupuesto/shared';
import { DataSource } from 'typeorm';
import {
  AccountEntity, BudgetLineEntity, CategoryEntity, DebtEntity, DebtPaymentEntity,
  GoalContributionEntity, GoalEntity, RecurringRuleEntity, TransactionEntity,
} from '../../database/entities';

@Injectable()
export class BackupService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async export(userId: string): Promise<BackupPayload> {
    const [accounts, categories, transactions, budgetLines, recurringRules, goals, debts] = await Promise.all([
      this.dataSource.getRepository(AccountEntity).find({ where: { userId } }),
      this.dataSource.getRepository(CategoryEntity).find({ where: { userId } }),
      this.dataSource.getRepository(TransactionEntity).find({ where: { userId } }),
      this.dataSource.getRepository(BudgetLineEntity).find({ where: { userId } }),
      this.dataSource.getRepository(RecurringRuleEntity).find({ where: { userId } }),
      this.dataSource.getRepository(GoalEntity).find({ where: { userId } }),
      this.dataSource.getRepository(DebtEntity).find({ where: { userId } }),
    ]);

    const goalIds = goals.map((g) => g.id);
    const debtIds = debts.map((d) => d.id);
    const goalContributions = goalIds.length
      ? await this.dataSource.getRepository(GoalContributionEntity)
        .createQueryBuilder('c').where('c.goalId IN (:...ids)', { ids: goalIds }).getMany()
      : [];
    const debtPayments = debtIds.length
      ? await this.dataSource.getRepository(DebtPaymentEntity)
        .createQueryBuilder('p').where('p.debtId IN (:...ids)', { ids: debtIds }).getMany()
      : [];

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      accounts: accounts as any, categories: categories as any, transactions: transactions as any,
      budgetLines: budgetLines as any, recurringRules: recurringRules as any, goals: goals as any,
      goalContributions: goalContributions as any, debts: debts as any, debtPayments: debtPayments as any,
    };
  }

  /**
   * Restaura una copia de seguridad: BORRA todos los datos actuales del usuario y
   * los sustituye por los del fichero, dentro de una única transacción (todo o nada,
   * para no dejar la cuenta a medio importar si algo falla a mitad de camino).
   * Los IDs del fichero se conservan para que las relaciones (padre de categoría,
   * cuenta de una regla recurrente...) sigan siendo válidas; `userId` se reescribe
   * siempre al del usuario que importa, nunca se confía en el valor del fichero.
   */
  async import(userId: string, payload: BackupPayload): Promise<{ imported: Record<string, number> }> {
    if (payload?.version !== 1) {
      throw new BadRequestException('Fichero de copia de seguridad no reconocido');
    }

    return this.dataSource.transaction(async (manager) => {
      // Orden de borrado: primero las tablas que dependen de otras (hijos antes que padres).
      await manager.getRepository(DebtPaymentEntity).createQueryBuilder()
        .delete().where('"debtId" IN (SELECT id FROM debts WHERE "userId" = :userId)', { userId }).execute();
      await manager.getRepository(DebtEntity).delete({ userId });
      await manager.getRepository(GoalContributionEntity).createQueryBuilder()
        .delete().where('"goalId" IN (SELECT id FROM goals WHERE "userId" = :userId)', { userId }).execute();
      await manager.getRepository(GoalEntity).delete({ userId });
      await manager.getRepository(RecurringRuleEntity).delete({ userId });
      await manager.getRepository(BudgetLineEntity).delete({ userId });
      await manager.getRepository(TransactionEntity).delete({ userId });
      await manager.getRepository(CategoryEntity).delete({ userId });
      await manager.getRepository(AccountEntity).delete({ userId });

      const withUser = <T extends object>(rows: T[]) => rows.map((r) => ({ ...r, userId }));
      const stamp = (rows: any[]) => rows; // los timestamps los pone la propia BD al insertar

      const counts: Record<string, number> = {};
      if (payload.accounts?.length) { await manager.getRepository(AccountEntity).insert(stamp(withUser(payload.accounts))); counts['accounts'] = payload.accounts.length; }
      if (payload.categories?.length) { await manager.getRepository(CategoryEntity).insert(stamp(withUser(payload.categories))); counts['categories'] = payload.categories.length; }
      if (payload.transactions?.length) { await manager.getRepository(TransactionEntity).insert(stamp(withUser(payload.transactions))); counts['transactions'] = payload.transactions.length; }
      if (payload.budgetLines?.length) { await manager.getRepository(BudgetLineEntity).insert(stamp(withUser(payload.budgetLines))); counts['budgetLines'] = payload.budgetLines.length; }
      if (payload.recurringRules?.length) { await manager.getRepository(RecurringRuleEntity).insert(stamp(withUser(payload.recurringRules))); counts['recurringRules'] = payload.recurringRules.length; }
      if (payload.goals?.length) { await manager.getRepository(GoalEntity).insert(stamp(withUser(payload.goals))); counts['goals'] = payload.goals.length; }
      if (payload.goalContributions?.length) { await manager.getRepository(GoalContributionEntity).insert(stamp(payload.goalContributions)); counts['goalContributions'] = payload.goalContributions.length; }
      if (payload.debts?.length) { await manager.getRepository(DebtEntity).insert(stamp(withUser(payload.debts))); counts['debts'] = payload.debts.length; }
      if (payload.debtPayments?.length) { await manager.getRepository(DebtPaymentEntity).insert(stamp(payload.debtPayments)); counts['debtPayments'] = payload.debtPayments.length; }

      return { imported: counts };
    });
  }
}
