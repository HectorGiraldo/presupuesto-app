import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecurringService } from './recurring.service';

/**
 * Cron diario que materializa los recurrentes con `autoGenerate = true`.
 * Separado de RecurringService para que el propio servicio sea testeable sin
 * arrastrar el scheduler de Nest.
 */
@Injectable()
export class RecurringCronService {
  constructor(private readonly recurring: RecurringService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailyGeneration(): Promise<void> {
    await this.recurring.runAutoGenerateForAllUsers();
  }
}
