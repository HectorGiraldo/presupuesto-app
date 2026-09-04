import { Controller, Get } from '@nestjs/common';
import type { DashboardSummary } from '@presupuesto/shared';
import { currentPeriod } from '@presupuesto/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountsService } from '../accounts/accounts.service';
import { BudgetsService } from '../budgets/budgets.service';
import { RecurringService } from '../recurring/recurring.service';
import { ReportsService } from '../reports/reports.service';

/**
 * Un único endpoint que junta lo que el dashboard necesita, para que la pantalla
 * principal haga una sola petición en vez de cinco al cargar.
 */
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly accounts: AccountsService,
    private readonly reports: ReportsService,
    private readonly budgets: BudgetsService,
    private readonly recurring: RecurringService,
  ) {}

  @Get()
  async summary(@CurrentUser('id') userId: string): Promise<DashboardSummary> {
    const { year, month } = currentPeriod();

    const [accounts, month_, budget, pendingRecurring] = await Promise.all([
      this.accounts.findAll(userId),
      this.reports.monthlySummary(userId, year, month),
      this.budgets.monthlyProgress(userId, year, month).catch(() => null),
      this.recurring.pending(userId),
    ]);

    const totalBalanceCents = accounts.reduce((sum, a) => sum + (a.currentBalanceCents ?? 0), 0);

    return {
      totalBalanceCents,
      month: month_,
      budget,
      pendingRecurring,
      accounts: accounts.map((a) => ({
        id: a.id, name: a.name, color: a.color, icon: a.icon, balanceCents: a.currentBalanceCents ?? 0,
      })),
    };
  }
}
