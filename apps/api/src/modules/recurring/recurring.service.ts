import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CategoryKind, RecurrenceFrequency, TransactionType,
  addDays, addMonths, today as todayDateOnly,
} from '@presupuesto/shared';
import type { DateOnly, PendingRecurring } from '@presupuesto/shared';
import { Repository } from 'typeorm';
import { RecurringRuleEntity, TransactionEntity } from '../../database/entities';
import { AccountsService } from '../accounts/accounts.service';
import { CategoriesService } from '../categories/categories.service';
import { CreateRecurringRuleDto, UpdateRecurringRuleDto } from './dto/recurring.dto';

/** Pasos de cada frecuencia. Semanal/quincenal avanzan por días; el resto por meses. */
const MONTH_STEPS: Partial<Record<RecurrenceFrequency, number>> = {
  [RecurrenceFrequency.MONTHLY]: 1,
  [RecurrenceFrequency.QUARTERLY]: 3,
  [RecurrenceFrequency.YEARLY]: 12,
};
const DAY_STEPS: Partial<Record<RecurrenceFrequency, number>> = {
  [RecurrenceFrequency.WEEKLY]: 7,
  [RecurrenceFrequency.BIWEEKLY]: 14,
};

@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  constructor(
    @InjectRepository(RecurringRuleEntity)
    private readonly repo: Repository<RecurringRuleEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactions: Repository<TransactionEntity>,
    private readonly accounts: AccountsService,
    private readonly categories: CategoriesService,
  ) {}

  /** Siguiente fecha tras `from`, según la frecuencia de la regla. */
  private nextOccurrence(rule: Pick<RecurringRuleEntity, 'frequency' | 'dayOfMonth'>, from: DateOnly): DateOnly {
    const monthStep = MONTH_STEPS[rule.frequency];
    if (monthStep) {
      const next = addMonths(from, monthStep);
      if (!rule.dayOfMonth) return next;
      // Si el mes destino no tiene ese día (ej. 31 en febrero), addMonths ya lo ajustó
      // al último día disponible, que es el comportamiento correcto.
      const [y, m] = next.split('-').map(Number);
      const lastDayOfMonth = new Date(y, m, 0).getDate();
      const day = Math.min(rule.dayOfMonth, lastDayOfMonth);
      return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    const dayStep = DAY_STEPS[rule.frequency];
    return addDays(from, dayStep ?? 7);
  }

  /**
   * Primera ocurrencia de la regla, respetando `dayOfMonth` desde el principio.
   * P.ej. una regla mensual con día 1 creada el día 4 no debe "deber" el día 4
   * (que no es un día válido de la regla): su primera ocurrencia real es el
   * día 1 del mes siguiente. Si `dayOfMonth` cae dentro del mismo mes en o
   * después de `startDate`, esa es la primera; si no, se pasa al mes siguiente.
   */
  private firstOccurrence(rule: Pick<RecurringRuleEntity, 'frequency' | 'dayOfMonth' | 'startDate'>): DateOnly {
    const monthStep = MONTH_STEPS[rule.frequency];
    if (!monthStep || !rule.dayOfMonth) return rule.startDate;

    const [y, m] = rule.startDate.split('-').map(Number);
    const lastDayOfMonth = new Date(y, m, 0).getDate();
    const day = Math.min(rule.dayOfMonth, lastDayOfMonth);
    const candidate = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return candidate >= rule.startDate ? candidate : this.nextOccurrence(rule, candidate);
  }

  /** Fechas pendientes de materializar entre la última generada (o el inicio) y hoy. */
  private duePoints(rule: RecurringRuleEntity, upTo: DateOnly): DateOnly[] {
    const dates: DateOnly[] = [];
    let cursor = rule.lastGeneratedDate ? this.nextOccurrence(rule, rule.lastGeneratedDate) : this.firstOccurrence(rule);
    let guard = 0;
    while (cursor <= upTo && (!rule.endDate || cursor <= rule.endDate) && guard < 500) {
      dates.push(cursor);
      cursor = this.nextOccurrence(rule, cursor);
      guard += 1;
    }
    return dates;
  }

  private async validateShape(userId: string, dto: CreateRecurringRuleDto | (UpdateRecurringRuleDto & { type: TransactionType })): Promise<void> {
    if (dto.accountId) await this.accounts.assertExists(userId, dto.accountId);

    if (dto.type === TransactionType.TRANSFER) {
      if (!dto.toAccountId) throw new BadRequestException('Un traspaso recurrente necesita cuenta de destino');
      if (dto.categoryId) throw new BadRequestException('Un traspaso no lleva categoría');
      if (dto.accountId) await this.accounts.assertTransferPair(userId, dto.accountId, dto.toAccountId);
    } else {
      if (dto.toAccountId) throw new BadRequestException('Solo los traspasos llevan cuenta de destino');
      if (!dto.categoryId) throw new BadRequestException('Los ingresos y gastos recurrentes necesitan categoría');
      const kind = dto.type === TransactionType.INCOME ? CategoryKind.INCOME : CategoryKind.EXPENSE;
      await this.categories.assertBelongsTo(userId, dto.categoryId, kind);
    }
  }

  async findAll(userId: string, includeInactive = false): Promise<RecurringRuleEntity[]> {
    const where = includeInactive ? { userId } : { userId, active: true };
    const rules = await this.repo.find({ where, relations: ['account', 'category'], order: { description: 'ASC' } });
    return rules.map((r) => Object.assign(r, {
      nextDate: r.lastGeneratedDate ? this.nextOccurrence(r, r.lastGeneratedDate) : this.firstOccurrence(r),
    }));
  }

  async findOne(userId: string, id: string): Promise<RecurringRuleEntity> {
    const rule = await this.repo.findOne({ where: { id, userId }, relations: ['account', 'category'] });
    if (!rule) throw new NotFoundException('Regla recurrente no encontrada');
    return rule;
  }

  async create(userId: string, dto: CreateRecurringRuleDto): Promise<RecurringRuleEntity> {
    await this.validateShape(userId, dto);
    const entity = this.repo.create({
      ...dto,
      userId,
      categoryId: dto.type === TransactionType.TRANSFER ? null : (dto.categoryId ?? null),
      toAccountId: dto.type === TransactionType.TRANSFER ? (dto.toAccountId ?? null) : null,
      autoGenerate: dto.autoGenerate ?? true,
      active: true,
      lastGeneratedDate: null,
    });
    return this.repo.save(entity);
  }

  async update(userId: string, id: string, dto: UpdateRecurringRuleDto): Promise<RecurringRuleEntity> {
    const existing = await this.findOne(userId, id);
    const merged = { ...existing, ...dto };
    if (dto.type || dto.accountId || dto.categoryId !== undefined || dto.toAccountId !== undefined) {
      await this.validateShape(userId, merged);
    }
    Object.assign(existing, dto);
    if (existing.type === TransactionType.TRANSFER) existing.categoryId = null;
    else existing.toAccountId = null;
    return this.repo.save(existing);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.repo.delete({ id, userId });
  }

  /** Lo que aparece en el dashboard: reglas con ocurrencias vencidas sin confirmar. */
  async pending(userId: string): Promise<PendingRecurring[]> {
    const today = todayDateOnly();
    const rules = await this.repo.find({ where: { userId, active: true }, relations: ['account', 'category'] });
    const result: PendingRecurring[] = [];

    for (const rule of rules) {
      const due = this.duePoints(rule, today);
      if (due.length === 0) continue;
      const dueDate = due[0]; // La más antigua pendiente es la relevante para avisar.
      result.push({
        ruleId: rule.id,
        description: rule.description,
        amountCents: rule.amountCents,
        type: rule.type,
        dueDate,
        categoryName: rule.category?.name ?? null,
        accountName: rule.account?.name ?? '',
        daysOverdue: this.daysBetween(dueDate, today),
      });
    }
    return result.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  }

  private daysBetween(from: DateOnly, to: DateOnly): number {
    const [fy, fm, fd] = from.split('-').map(Number);
    const [ty, tm, td] = to.split('-').map(Number);
    const ms = Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd);
    return Math.round(ms / 86_400_000);
  }

  /**
   * Materializa las ocurrencias vencidas de una regla como movimientos reales.
   * Idempotente: avanza `lastGeneratedDate` en la misma operación, así que una
   * segunda llamada (cron duplicado, doble clic) no encuentra nada pendiente y no crea nada.
   */
  async generateForRule(userId: string, rule: RecurringRuleEntity, upTo: DateOnly): Promise<number> {
    const due = this.duePoints(rule, upTo);
    if (due.length === 0) return 0;

    for (const date of due) {
      // Cinturón y tirantes: comprueba que no exista ya un movimiento de esta regla en esta fecha
      // antes de insertar, por si dos procesos corrieran el cron a la vez.
      const exists = await this.transactions.exists({ where: { userId, recurringRuleId: rule.id, date } });
      if (exists) continue;
      await this.transactions.save(this.transactions.create({
        userId,
        type: rule.type,
        accountId: rule.accountId,
        toAccountId: rule.toAccountId,
        categoryId: rule.categoryId,
        amountCents: rule.amountCents,
        date,
        description: rule.description,
        notes: null,
        tags: [],
        recurringRuleId: rule.id,
      }));
    }

    rule.lastGeneratedDate = due[due.length - 1];
    await this.repo.save(rule);
    return due.length;
  }

  /** Confirma manualmente una regla con `autoGenerate = false`. */
  async confirm(userId: string, ruleId: string): Promise<number> {
    const rule = await this.findOne(userId, ruleId);
    return this.generateForRule(userId, rule, todayDateOnly());
  }

  /** Llamado por el cron diario: solo procesa reglas marcadas para generarse solas. */
  async runAutoGenerateForAllUsers(): Promise<{ rulesProcessed: number; transactionsCreated: number }> {
    const rules = await this.repo.find({ where: { active: true, autoGenerate: true } });
    const today = todayDateOnly();
    let created = 0;
    for (const rule of rules) {
      created += await this.generateForRule(rule.userId, rule, today);
    }
    this.logger.log(`Recurrentes: ${rules.length} reglas revisadas, ${created} movimientos generados`);
    return { rulesProcessed: rules.length, transactionsCreated: created };
  }
}
