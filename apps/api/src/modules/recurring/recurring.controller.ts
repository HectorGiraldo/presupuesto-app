import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import type { PendingRecurring, RecurringRule } from '@presupuesto/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateRecurringRuleDto, UpdateRecurringRuleDto } from './dto/recurring.dto';
import { RecurringService } from './recurring.service';

@Controller('recurring')
export class RecurringController {
  constructor(private readonly service: RecurringService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<RecurringRule[]> {
    return this.service.findAll(userId, includeInactive === 'true') as unknown as Promise<RecurringRule[]>;
  }

  @Get('pending')
  pending(@CurrentUser('id') userId: string): Promise<PendingRecurring[]> {
    return this.service.pending(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateRecurringRuleDto): Promise<RecurringRule> {
    return this.service.create(userId, dto) as Promise<RecurringRule>;
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecurringRuleDto,
  ): Promise<RecurringRule> {
    return this.service.update(userId, id, dto) as Promise<RecurringRule>;
  }

  @Post(':id/generate')
  async generate(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    const count = await this.service.confirm(userId, id);
    return { generated: count };
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(userId, id);
  }
}
