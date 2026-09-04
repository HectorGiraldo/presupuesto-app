import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurringRuleEntity, TransactionEntity } from '../../database/entities';
import { AccountsModule } from '../accounts/accounts.module';
import { CategoriesModule } from '../categories/categories.module';
import { RecurringCronService } from './recurring-cron.service';
import { RecurringController } from './recurring.controller';
import { RecurringService } from './recurring.service';

@Module({
  imports: [TypeOrmModule.forFeature([RecurringRuleEntity, TransactionEntity]), AccountsModule, CategoriesModule],
  controllers: [RecurringController],
  providers: [RecurringService, RecurringCronService],
  exports: [RecurringService],
})
export class RecurringModule {}
