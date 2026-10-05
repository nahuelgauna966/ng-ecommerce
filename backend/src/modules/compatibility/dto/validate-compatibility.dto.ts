import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsPositive,
} from 'class-validator';

export class ValidateCompatibilityDto {
  @ApiProperty({
    type: [Number],
    example: [12, 18, 24, 31, 42],
    description:
      'IDs de hasta 10 productos activos, como máximo uno por tipo de componente. Puede estar vacío para consultar los componentes requeridos.',
  })
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  productIds: number[];
}
