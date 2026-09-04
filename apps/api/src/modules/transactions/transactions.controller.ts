import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import type { Transaction, TransactionList } from '@presupuesto/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTransactionDto, TransactionQueryDto, UpdateTransactionDto } from './dto/transaction.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query() query: TransactionQueryDto): Promise<TransactionList> {
    return this.service.findAll(userId, query);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string): Promise<Transaction> {
    return this.service.findOne(userId, id) as unknown as Promise<Transaction>;
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTransactionDto): Promise<Transaction> {
    return this.service.create(userId, dto) as unknown as Promise<Transaction>;
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    return this.service.update(userId, id, dto) as unknown as Promise<Transaction>;
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(userId, id);
  }
}
