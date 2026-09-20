import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ example: 1, description: 'Filtrar por id de categoría' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({
    example: 'placa de video',
    description: 'Buscar productos por nombre',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  @IsOptional()
  search?: string;
}
