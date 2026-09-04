import { Type } from 'class-transformer';
import {
  IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min,
} from 'class-validator';

export class UpsertBudgetLineDto {
  @IsUUID()
  categoryId!: string;

  @IsInt() @Min(2000) @Max(2100)
  year!: number;

  /** null = objetivo anual. */
  @IsOptional() @IsInt() @Min(1) @Max(12)
  month?: number | null;

  @IsInt()
  plannedCents!: number;

  @IsOptional() @IsBoolean()
  rollover?: boolean;

  @IsOptional() @IsString()
  notes?: string | null;
}

export class CopyBudgetDto {
  @Type(() => Number) @IsInt() fromYear!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(12) fromMonth!: number;
  @Type(() => Number) @IsInt() toYear!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(12) toMonth!: number;
}
