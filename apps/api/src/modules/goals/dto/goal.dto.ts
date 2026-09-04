import {
  IsBoolean, IsDateString, IsHexColor, IsInt, IsOptional, IsPositive, IsString, IsUUID, Length,
} from 'class-validator';

export class CreateGoalDto {
  @IsString() @Length(1, 120)
  name!: string;

  @IsInt() @IsPositive()
  targetCents!: number;

  @IsOptional() @IsDateString({ strict: true })
  targetDate?: string | null;

  @IsOptional() @IsUUID()
  accountId?: string | null;

  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsString() @Length(1, 40) icon?: string;
}

export class UpdateGoalDto {
  @IsOptional() @IsString() @Length(1, 120) name?: string;
  @IsOptional() @IsInt() @IsPositive() targetCents?: number;
  @IsOptional() @IsDateString({ strict: true }) targetDate?: string | null;
  @IsOptional() @IsUUID() accountId?: string | null;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsString() @Length(1, 40) icon?: string;
  @IsOptional() @IsBoolean() archived?: boolean;
}

export class CreateContributionDto {
  @IsInt() @IsPositive()
  amountCents!: number;

  @IsDateString({ strict: true })
  date!: string;

  @IsOptional() @IsString()
  notes?: string | null;
}
