import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query,
} from '@nestjs/common';
import type { BudgetLine, BudgetProgress } from '@presupuesto/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BudgetsService } from './budgets.service';
import { CopyBudgetDto, UpsertBudgetLineDto } from './dto/budget.dto';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly service: BudgetsService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('year') year: string,
    @Query('month') month?: string,
  ): Promise<BudgetLine[]> {
    return this.service.findAll(userId, Number(year), month ? Number(month) : null) as Promise<BudgetLine[]>;
  }

  @Get('progress')
  progress(
    @CurrentUser('id') userId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ): Promise<BudgetProgress> {
    return this.service.monthlyProgress(userId, Number(year), Number(month));
  }

  @Post()
  upsert(@CurrentUser('id') userId: string, @Body() dto: UpsertBudgetLineDto): Promise<BudgetLine> {
    return this.service.upsert(userId, dto) as Promise<BudgetLine>;
  }

  @Post('copy-from-previous')
  copy(@CurrentUser('id') userId: string, @Body() dto: CopyBudgetDto): Promise<BudgetLine[]> {
    return this.service.copyFromPrevious(userId, dto) as Promise<BudgetLine[]>;
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(userId, id);
  }
}
