import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { RecurringModule } from '../recurring/recurring.module';
import { ReportsModule } from '../reports/reports.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [AccountsModule, ReportsModule, BudgetsModule, RecurringModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
