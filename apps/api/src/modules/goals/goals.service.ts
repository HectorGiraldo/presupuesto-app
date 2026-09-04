import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { fromDateOnly, percentage, today } from '@presupuesto/shared';
import type { Goal } from '@presupuesto/shared';
import { Repository } from 'typeorm';
import { GoalContributionEntity, GoalEntity } from '../../database/entities';
import { AccountsService } from '../accounts/accounts.service';
import { CreateContributionDto, CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(GoalEntity)
    private readonly repo: Repository<GoalEntity>,
    @InjectRepository(GoalContributionEntity)
    private readonly contributions: Repository<GoalContributionEntity>,
    private readonly accounts: AccountsService,
  ) {}

  private async decorate(goal: GoalEntity): Promise<Goal> {
    const savedRow = await this.contributions
      .createQueryBuilder('c')
      .select('SUM(c.amountCents)', 'total')
      .where('c.goalId = :id', { id: goal.id })
      .getRawOne<{ total: string | null }>();
    const savedCents = Number(savedRow?.total ?? 0);
    const remainingCents = Math.max(0, goal.targetCents - savedCents);
    const progressPercent = percentage(savedCents, goal.targetCents);

    let monthsRemaining: number | undefined;
    let monthlyNeededCents: number | undefined;
    if (goal.targetDate) {
      const months = this.monthsBetween(today(), goal.targetDate);
      monthsRemaining = Math.max(0, months);
      monthlyNeededCents = monthsRemaining > 0 ? Math.ceil(remainingCents / monthsRemaining) : remainingCents;
    }

    return {
      id: goal.id, name: goal.name, targetCents: goal.targetCents, savedCents,
      targetDate: goal.targetDate, accountId: goal.accountId, color: goal.color,
      icon: goal.icon, archived: goal.archived,
      progressPercent, remainingCents, monthlyNeededCents, monthsRemaining,
    };
  }

  private monthsBetween(from: string, to: string): number {
    const a = fromDateOnly(from);
    const b = fromDateOnly(to);
    return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + (b.getDate() >= a.getDate() ? 0 : -1);
  }

  async findAll(userId: string, includeArchived = false): Promise<Goal[]> {
    const where = includeArchived ? { userId } : { userId, archived: false };
    const goals = await this.repo.find({ where, order: { name: 'ASC' } });
    return Promise.all(goals.map((g) => this.decorate(g)));
  }

  async findOne(userId: string, id: string): Promise<Goal> {
    const goal = await this.getEntity(userId, id);
    return this.decorate(goal);
  }

  private async getEntity(userId: string, id: string): Promise<GoalEntity> {
    const goal = await this.repo.findOne({ where: { id, userId } });
    if (!goal) throw new NotFoundException('Meta no encontrada');
    return goal;
  }

  async create(userId: string, dto: CreateGoalDto): Promise<Goal> {
    if (dto.accountId) await this.accounts.assertExists(userId, dto.accountId);
    const saved = await this.repo.save(this.repo.create({ ...dto, userId }));
    return this.decorate(saved);
  }

  async update(userId: string, id: string, dto: UpdateGoalDto): Promise<Goal> {
    const goal = await this.getEntity(userId, id);
    if (dto.accountId) await this.accounts.assertExists(userId, dto.accountId);
    Object.assign(goal, dto);
    return this.decorate(await this.repo.save(goal));
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getEntity(userId, id);
    await this.repo.delete({ id, userId });
  }

  async addContribution(userId: string, goalId: string, dto: CreateContributionDto): Promise<Goal> {
    const goal = await this.getEntity(userId, goalId);
    await this.contributions.save(this.contributions.create({ ...dto, goalId: goal.id }));
    return this.decorate(goal);
  }

  async listContributions(userId: string, goalId: string): Promise<GoalContributionEntity[]> {
    await this.getEntity(userId, goalId);
    return this.contributions.find({ where: { goalId }, order: { date: 'DESC' } });
  }
}
