import { CategoryKind } from '@presupuesto/shared';
import {
  IsBoolean, IsEnum, IsHexColor, IsOptional, IsString, IsUUID, Length,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsEnum(CategoryKind, { message: 'El tipo debe ser INCOME o EXPENSE' })
  kind!: CategoryKind;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsHexColor({ message: 'El color debe ser hexadecimal, ej. #3b82f6' })
  color?: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  icon?: string;

  @IsOptional()
  @IsBoolean()
  essential?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @Length(1, 120) name?: string;
  @IsOptional() @IsEnum(CategoryKind) kind?: CategoryKind;
  @IsOptional() @IsUUID() parentId?: string | null;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsString() @Length(1, 40) icon?: string;
  @IsOptional() @IsBoolean() essential?: boolean;
  @IsOptional() @IsBoolean() archived?: boolean;
}
