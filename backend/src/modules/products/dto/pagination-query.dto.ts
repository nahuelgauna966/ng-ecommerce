import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ComponentType } from '../product-component.types';

export const MAX_PRODUCT_QUERY_LIMIT = 50;

export class PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    minimum: 1,
    maximum: MAX_PRODUCT_QUERY_LIMIT,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PRODUCT_QUERY_LIMIT)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 1,
    description: 'Filtrar por id de categoría',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({
    example: 'placa de video',
    description: 'Buscar productos por nombre',
  })
  @Transform(({ value }: TransformFnParams) => {
    const searchValue: unknown = value;
    return typeof searchValue === 'string' ? searchValue.trim() : searchValue;
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: ComponentType,
    description: 'Filtrar por tipo de componente',
  })
  @IsEnum(ComponentType)
  @IsOptional()
  componentType?: ComponentType;

  @ApiPropertyOptional({
    example: 'AMD',
    maxLength: 100,
    description: 'Filtrar por marca, sin distinguir mayúsculas y minúsculas',
  })
  @Transform(({ value }: TransformFnParams) => {
    const brandValue: unknown = value;
    return typeof brandValue === 'string' ? brandValue.trim() : brandValue;
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  brand?: string;
}
