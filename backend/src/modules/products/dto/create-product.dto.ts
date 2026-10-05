import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  IsBoolean,
  IsEnum,
  IsObject,
  MaxLength,
  Validate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComponentType, type HardwareSpecs } from '../product-component.types';
import { HardwareSpecsMatchesComponentTypeConstraint } from './hardware-specs.validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Auriculares inalámbricos' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Auriculares Bluetooth con cancelación de ruido',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'AMD', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ enum: ComponentType, example: ComponentType.CPU })
  @IsEnum(ComponentType)
  @IsOptional()
  componentType?: ComponentType;

  @ApiPropertyOptional({
    description:
      'Especificaciones técnicas opcionales; las propiedades válidas dependen del tipo de componente.',
    example: { socket: 'AM5', powerDrawWatts: 105 },
  })
  @IsObject()
  @Validate(HardwareSpecsMatchesComponentTypeConstraint)
  @IsOptional()
  hardwareSpecs?: HardwareSpecs;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiProperty({ example: 49999.99 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Id de la categoría asociada',
  })
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ example: 10, default: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  initialStock?: number = 0;
}
