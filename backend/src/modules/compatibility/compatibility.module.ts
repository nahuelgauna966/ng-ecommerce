import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { CompatibilityController } from './compatibility.controller';
import { CompatibilityService } from './compatibility.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [CompatibilityController],
  providers: [CompatibilityService],
})
export class CompatibilityModule {}
