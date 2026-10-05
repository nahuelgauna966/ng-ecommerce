import { ApiProperty } from '@nestjs/swagger';
import type {
  CompatibilityCheck,
  CompatibilityProductSummary,
  CompatibilityResult,
  CompatibilityRuleStatus,
  CompatibilityStatus,
} from '../compatibility.types';

export class CompatibilityProductDto implements CompatibilityProductSummary {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'Procesador de ejemplo' })
  name: string;

  @ApiProperty({ example: 'cpu', nullable: true })
  componentType: string | null;
}

export class CompatibilityCheckDto implements CompatibilityCheck {
  @ApiProperty({ example: 'cpu_motherboard_socket' })
  rule: string;

  @ApiProperty({ enum: ['compatible', 'incompatible', 'incomplete'] })
  status: CompatibilityRuleStatus;

  @ApiProperty({ type: [Number], example: [12, 18] })
  productIds: number[];

  @ApiProperty({ example: 'Los sockets AM5 y AM5 son compatibles.' })
  message: string;
}

export class CompatibilityResultDto implements CompatibilityResult {
  @ApiProperty({ enum: ['compatible', 'incompatible', 'incomplete'] })
  status: CompatibilityStatus;

  @ApiProperty({ type: [CompatibilityProductDto] })
  products: CompatibilityProductDto[];

  @ApiProperty({ type: [CompatibilityCheckDto] })
  checks: CompatibilityCheckDto[];
}
