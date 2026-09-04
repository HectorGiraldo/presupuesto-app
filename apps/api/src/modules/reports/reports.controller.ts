import { Controller, Get, Query } from '@nestjs/common';
import type {
  AnnualSummary, CashflowPoint, CategoryTrend, EssentialsSplit, MonthlySummary,
} from '@presupuesto/shared';
import { currentPeriod } from '@presupuesto/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('monthly-summary')
  monthlySummary(
    @CurrentUser('id') userId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ): Promise<MonthlySummary> {
    const period = currentPeriod();
    return this.service.monthlySummary(userId, Number(year ?? period.year), Number(month ?? period.month));
  }

  @Get('annual-summary')
  annualSummary(@CurrentUser('id') userId: string, @Query('year') year?: string): Promise<AnnualSummary> {
    return this.service.annualSummary(userId, Number(year ?? currentPeriod().year));
  }

  @Get('category-trend')
  categoryTrend(
    @CurrentUser('id') userId: string,
    @Query('categoryId') categoryId: string,
    @Query('months') months?: string,
  ): Promise<CategoryTrend> {
    return this.service.categoryTrend(userId, categoryId, months ? Number(months) : 12);
  }

  @Get('cashflow')
  cashflow(
    @CurrentUser('id') userId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<CashflowPoint[]> {
    return this.service.cashflow(userId, from, to);
  }

  @Get('essentials-split')
  essentialsSplit(
    @CurrentUser('id') userId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ): Promise<EssentialsSplit> {
    const period = currentPeriod();
    return this.service.essentialsSplit(userId, Number(year ?? period.year), Number(month ?? period.month));
  }
}
