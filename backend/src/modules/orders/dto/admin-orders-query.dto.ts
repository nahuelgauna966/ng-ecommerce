import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../order.entity';

export class AdminOrdersQueryDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    minimum: 1,
    description: 'Página a recuperar.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    minimum: 1,
    description: 'Cantidad de pedidos por página.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: OrderStatus,
    example: OrderStatus.PROCESSING,
    description: 'Filtra pedidos por estado.',
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({
    example: '2026-09-01',
    format: 'date',
    description: 'Fecha de creación mínima, en formato ISO 8601.',
  })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-09-30',
    format: 'date',
    description: 'Fecha de creación máxima, en formato ISO 8601.',
  })
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({
    example: 'maria@example.com',
    description: 'Busca por nombre o correo electrónico del cliente.',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
