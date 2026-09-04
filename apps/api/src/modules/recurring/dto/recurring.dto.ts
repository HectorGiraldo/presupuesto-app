import { RecurrenceFrequency, TransactionType } from '@presupuesto/shared';
import {
  IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsPositive, IsString, IsUUID, Length, Max, Min,
} from 'class-validator';

export class CreateRecurringRuleDto {
  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsUUID()
  accountId!: string;

  @IsOptional() @IsUUID()
  toAccountId?: string | null;

  @IsOptional() @IsUUID()
  categoryId?: string | null;

  @IsInt() @IsPositive()
  amountCents!: number;

  @IsString() @Length(1, 255)
  description!: string;

  @IsEnum(RecurrenceFrequency)
  frequency!: RecurrenceFrequency;

  @IsOptional() @IsInt() @Min(1) @Max(31)
  dayOfMonth?: number | null;

  @IsDateString({ strict: true })
  startDate!: string;

  @IsOptional() @IsDateString({ strict: true })
  endDate?: string | null;

  @IsOptional() @IsBoolean()
  autoGenerate?: boolean;
}

export class UpdateRecurringRuleDto {
  @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @IsOptional() @IsUUID() accountId?: string;
  @IsOptional() @IsUUID() toAccountId?: string | null;
  @IsOptional() @IsUUID() categoryId?: string | null;
  @IsOptional() @IsInt() @IsPositive() amountCents?: number;
  @IsOptional() @IsString() @Length(1, 255) description?: string;
  @IsOptional() @IsEnum(RecurrenceFrequency) frequency?: RecurrenceFrequency;
  @IsOptional() @IsInt() @Min(1) @Max(31) dayOfMonth?: number | null;
  @IsOptional() @IsDateString({ strict: true }) startDate?: string;
  @IsOptional() @IsDateString({ strict: true }) endDate?: string | null;
  @IsOptional() @IsBoolean() autoGenerate?: boolean;
  @IsOptional() @IsBoolean() active?: boolean;
}
