import { TransactionType } from '@presupuesto/shared';
import { Type } from 'class-transformer';
import {
  IsArray, IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsPositive, IsString, IsUUID, Length,
} from 'class-validator';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsUUID()
  accountId!: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsUUID()
  toAccountId?: string | null;

  @IsInt()
  @IsPositive({ message: 'El importe debe ser mayor que cero' })
  amountCents!: number;

  @IsDateString({ strict: true }, { message: 'La fecha debe tener formato AAAA-MM-DD' })
  date!: string;

  @IsString()
  @Length(1, 255)
  description!: string;

  @IsOptional() @IsString() notes?: string | null;

  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

export class UpdateTransactionDto {
  @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @IsOptional() @IsUUID() accountId?: string;
  @IsOptional() @IsUUID() categoryId?: string | null;
  @IsOptional() @IsUUID() toAccountId?: string | null;
  @IsOptional() @IsInt() @IsPositive() amountCents?: number;
  @IsOptional() @IsDateString({ strict: true }) date?: string;
  @IsOptional() @IsString() @Length(1, 255) description?: string;
  @IsOptional() @IsString() notes?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

export class TransactionQueryDto {
  @IsOptional() @IsDateString({ strict: true }) from?: string;
  @IsOptional() @IsDateString({ strict: true }) to?: string;
  @IsOptional() @IsUUID() accountId?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @IsOptional() @IsString() search?: string;

  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @IsIn([10, 20, 50, 100]) pageSize?: number;
}
