import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import type { AmortizationSchedule, Debt } from '@presupuesto/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateDebtDto, CreateDebtPaymentDto, UpdateDebtDto } from './dto/debt.dto';
import { DebtsService } from './debts.service';

@Controller('debts')
export class DebtsController {
  constructor(private readonly service: DebtsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query('includeArchived') includeArchived?: string): Promise<Debt[]> {
    return this.service.findAll(userId, includeArchived === 'true');
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string): Promise<Debt> {
    return this.service.findOne(userId, id);
  }

  @Get(':id/payments')
  payments(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.listPayments(userId, id);
  }

  @Get(':id/amortization')
  amortization(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string): Promise<AmortizationSchedule> {
    return this.service.amortizationSchedule(userId, id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateDebtDto): Promise<Debt> {
    return this.service.create(userId, dto);
  }

  @Post(':id/payments')
  addPayment(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDebtPaymentDto,
  ): Promise<Debt> {
    return this.service.addPayment(userId, id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDebtDto,
  ): Promise<Debt> {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(userId, id);
  }
}
