import { DebtType } from '@presupuesto/shared';
import {
  IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Length, Max, Min,
} from 'class-validator';

export class CreateDebtDto {
  @IsString() @Length(1, 120)
  name!: string;

  @IsEnum(DebtType)
  type!: DebtType;

  @IsInt() @IsPositive()
  principalCents!: number;

  @IsOptional() @IsInt() @Min(0)
  currentBalanceCents?: number;

  /** TIN anual en %, ej. 3.25 */
  @IsNumber() @Min(0) @Max(100)
  interestRate!: number;

  @IsInt() @Min(0)
  monthlyPaymentCents!: number;

  @IsDateString({ strict: true })
  startDate!: string;

  @IsOptional() @IsInt() @Min(1)
  termMonths?: number | null;

  @IsOptional() @IsUUID()
  accountId?: string | null;
}

export class UpdateDebtDto {
  @IsOptional() @IsString() @Length(1, 120) name?: string;
  @IsOptional() @IsEnum(DebtType) type?: DebtType;
  @IsOptional() @IsInt() @IsPositive() principalCents?: number;
  @IsOptional() @IsInt() @Min(0) currentBalanceCents?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) interestRate?: number;
  @IsOptional() @IsInt() @Min(0) monthlyPaymentCents?: number;
  @IsOptional() @IsDateString({ strict: true }) startDate?: string;
  @IsOptional() @IsInt() @Min(1) termMonths?: number | null;
  @IsOptional() @IsUUID() accountId?: string | null;
  @IsOptional() @IsBoolean() archived?: boolean;
}

export class CreateDebtPaymentDto {
  @IsInt() @IsPositive()
  amountCents!: number;

  @IsDateString({ strict: true })
  date!: string;

  @IsOptional() @IsString()
  notes?: string | null;

  @IsOptional() @IsInt() @Min(0)
  principalCents?: number;

  @IsOptional() @IsInt() @Min(0)
  interestCents?: number;
}
