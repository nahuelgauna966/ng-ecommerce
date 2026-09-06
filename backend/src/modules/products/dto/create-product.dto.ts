import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Auriculares inalámbricos' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Auriculares Bluetooth con cancelación de ruido' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 49999.99 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ example: 1, description: 'Id de la categoría asociada' })
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ example: 10, default: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  initialStock?: number = 0;
}
