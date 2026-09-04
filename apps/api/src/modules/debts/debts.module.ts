import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity, DebtEntity, DebtPaymentEntity, TransactionEntity } from '../../database/entities';
import { AccountsModule } from '../accounts/accounts.module';
import { DebtsController } from './debts.controller';
import { DebtsService } from './debts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DebtEntity, DebtPaymentEntity, TransactionEntity, CategoryEntity]),
    AccountsModule,
  ],
  controllers: [DebtsController],
  providers: [DebtsService],
  exports: [DebtsService],
})
export class DebtsModule {}
