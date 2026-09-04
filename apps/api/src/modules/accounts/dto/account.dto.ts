import { AccountType } from '@presupuesto/shared';
import {
  IsBoolean, IsEnum, IsHexColor, IsInt, IsOptional, IsString, Length,
} from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsEnum(AccountType)
  type!: AccountType;

  @IsInt({ message: 'El saldo inicial debe ir en céntimos enteros' })
  initialBalanceCents!: number;

  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsString() @Length(1, 40) icon?: string;
}

export class UpdateAccountDto {
  @IsOptional() @IsString() @Length(1, 120) name?: string;
  @IsOptional() @IsEnum(AccountType) type?: AccountType;
  @IsOptional() @IsInt() initialBalanceCents?: number;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsString() @Length(1, 40) icon?: string;
  @IsOptional() @IsBoolean() archived?: boolean;
}
