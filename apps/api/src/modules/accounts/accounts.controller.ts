import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import type { Account } from '@presupuesto/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly service: AccountsService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('includeArchived') includeArchived?: string,
  ): Promise<Account[]> {
    return this.service.findAll(userId, includeArchived === 'true') as Promise<Account[]>;
  }

  @Get('balances')
  async balances(@CurrentUser('id') userId: string) {
    const map = await this.service.balancesMap(userId);
    return Object.fromEntries(map);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateAccountDto): Promise<Account> {
    return this.service.create(userId, dto) as Promise<Account>;
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<Account> {
    return this.service.update(userId, id, dto) as Promise<Account>;
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(userId, id);
  }
}
