import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';
import { MAX_PRODUCT_QUERY_LIMIT } from './pagination-query.dto';

export class ProductDiscoveryQueryDto {
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
  limit = 10;
}
