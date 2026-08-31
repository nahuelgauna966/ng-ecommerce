import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from './stock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stock])],
  exports: [TypeOrmModule],
})
export class StockModule {}
