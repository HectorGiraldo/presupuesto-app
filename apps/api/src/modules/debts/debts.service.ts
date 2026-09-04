import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryKind, TransactionType, percentage } from '@presupuesto/shared';
import type { AmortizationSchedule, Debt } from '@presupuesto/shared';
import { Repository } from 'typeorm';
import { CategoryEntity, DebtEntity, DebtPaymentEntity, TransactionEntity } from '../../database/entities';
import { AccountsService } from '../accounts/accounts.service';
import { buildAmortizationSchedule } from './amortization.util';
import { CreateDebtDto, CreateDebtPaymentDto, UpdateDebtDto } from './dto/debt.dto';

/** Categoría por defecto (sembrada para todo usuario) donde caen los pagos de deuda como gasto real. */
const DEBT_PAYMENT_CATEGORY_NAME = 'Deudas e intereses';

@Injectable()
export class DebtsService {
  private readonly logger = new Logger(DebtsService.name);

  constructor(
    @InjectRepository(DebtEntity)
    private readonly repo: Repository<DebtEntity>,
    @InjectRepository(DebtPaymentEntity)
    private readonly payments: Repository<DebtPaymentEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactions: Repository<TransactionEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categories: Repository<CategoryEntity>,
    private readonly accounts: AccountsService,
  ) {}

  private decorate(debt: DebtEntity): Debt {
    const paidCents = debt.principalCents - debt.currentBalanceCents;
    const monthlyRate = debt.interestRate / 100 / 12;
    // Meses restantes con la cuota actual, redondeando hacia arriba: mejor sobreestimar
    // que decirle que ya casi termina cuando aún le quedan pagos.
    const remainingMonths = debt.monthlyPaymentCents > monthlyRate * debt.currentBalanceCents
      ? Math.ceil(this.monthsToPayoff(debt.currentBalanceCents, monthlyRate, debt.monthlyPaymentCents))
      : undefined;

    return {
      id: debt.id, name: debt.name, type: debt.type, principalCents: debt.principalCents,
      currentBalanceCents: debt.currentBalanceCents, interestRate: debt.interestRate,
      monthlyPaymentCents: debt.monthlyPaymentCents, startDate: debt.startDate,
      termMonths: debt.termMonths, accountId: debt.accountId, archived: debt.archived,
      paidCents, progressPercent: percentage(paidCents, debt.principalCents), remainingMonths,
    };
  }

  private monthsToPayoff(balanceCents: number, monthlyRate: number, paymentCents: number): number {
    if (balanceCents <= 0) return 0;
    if (monthlyRate === 0) return balanceCents / paymentCents;
    // Fórmula estándar del sistema francés despejando n.
    return Math.log(paymentCents / (paymentCents - balanceCents * monthlyRate)) / Math.log(1 + monthlyRate);
  }

  async findAll(userId: string, includeArchived = false): Promise<Debt[]> {
    const where = includeArchived ? { userId } : { userId, archived: false };
    const debts = await this.repo.find({ where, order: { name: 'ASC' } });
    return debts.map((d) => this.decorate(d));
  }

  async findOne(userId: string, id: string): Promise<Debt> {
    return this.decorate(await this.getEntity(userId, id));
  }

  private async getEntity(userId: string, id: string): Promise<DebtEntity> {
    const debt = await this.repo.findOne({ where: { id, userId } });
    if (!debt) throw new NotFoundException('Deuda no encontrada');
    return debt;
  }

  async create(userId: string, dto: CreateDebtDto): Promise<Debt> {
    if (dto.accountId) await this.accounts.assertExists(userId, dto.accountId);
    const saved = await this.repo.save(this.repo.create({
      ...dto,
      userId,
      currentBalanceCents: dto.currentBalanceCents ?? dto.principalCents,
    }));
    return this.decorate(saved);
  }

  async update(userId: string, id: string, dto: UpdateDebtDto): Promise<Debt> {
    const debt = await this.getEntity(userId, id);
    if (dto.accountId) await this.accounts.assertExists(userId, dto.accountId);
    Object.assign(debt, dto);
    return this.decorate(await this.repo.save(debt));
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getEntity(userId, id);
    await this.repo.delete({ id, userId });
  }

  /**
   * Registra un pago: si no se indica el reparto capital/intereses, se calcula
   * automáticamente con el TIN sobre el saldo actual (igual que hace el banco).
   */
  async addPayment(userId: string, debtId: string, dto: CreateDebtPaymentDto): Promise<Debt> {
    const debt = await this.getEntity(userId, debtId);

    let interestCents = dto.interestCents;
    let principalCents = dto.principalCents;
    if (interestCents === undefined || principalCents === undefined) {
      const monthlyRate = debt.interestRate / 100 / 12;
      interestCents = Math.round(debt.currentBalanceCents * monthlyRate);
      principalCents = Math.max(0, dto.amountCents - interestCents);
    }
    principalCents = Math.min(principalCents, debt.currentBalanceCents);

    await this.payments.save(this.payments.create({
      debtId: debt.id, amountCents: dto.amountCents, date: dto.date,
      notes: dto.notes ?? null, principalCents, interestCents,
    }));

    debt.currentBalanceCents = Math.max(0, debt.currentBalanceCents - principalCents);
    const saved = await this.repo.save(debt);

    // Si la deuda tiene una cuenta de cargo, el pago es dinero real que sale de esa
    // cuenta: se refleja como un gasto normal, si no, el saldo de la cuenta y el
    // "gastado este mes" del dashboard se quedarían cortos en cuanto se empieza a
    // pagar una hipoteca o un préstamo, que es justo lo que se quiere controlar.
    if (debt.accountId) {
      const category = await this.findDebtPaymentCategory(userId);
      if (category) {
        await this.transactions.save(this.transactions.create({
          userId, type: TransactionType.EXPENSE, accountId: debt.accountId, categoryId: category.id,
          amountCents: dto.amountCents, date: dto.date, description: `Pago: ${debt.name}`,
          notes: dto.notes ?? null, tags: [], toAccountId: null, recurringRuleId: null,
        }));
      } else {
        this.logger.warn(`No se encontró la categoría "${DEBT_PAYMENT_CATEGORY_NAME}": el pago de "${debt.name}" no se refleja como movimiento`);
      }
    }

    return this.decorate(saved);
  }

  private async findDebtPaymentCategory(userId: string): Promise<CategoryEntity | null> {
    return this.categories.findOne({
      where: { userId, kind: CategoryKind.EXPENSE, name: DEBT_PAYMENT_CATEGORY_NAME },
    });
  }

  async listPayments(userId: string, debtId: string): Promise<DebtPaymentEntity[]> {
    await this.getEntity(userId, debtId);
    return this.payments.find({ where: { debtId }, order: { date: 'DESC' } });
  }

  /** Cuadro de amortización completo desde el origen del préstamo. */
  async amortizationSchedule(userId: string, debtId: string): Promise<AmortizationSchedule> {
    const debt = await this.getEntity(userId, debtId);
    return buildAmortizationSchedule(
      debt.principalCents, debt.interestRate, debt.monthlyPaymentCents, debt.startDate, debt.termMonths,
    );
  }
}
