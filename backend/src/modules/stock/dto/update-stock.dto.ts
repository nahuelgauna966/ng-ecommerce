import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStockDto {
  @ApiProperty({ example: 25, minimum: 0 })
  @IsInt()
  @Min(0)
  quantity: number;
}