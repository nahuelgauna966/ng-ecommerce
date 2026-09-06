import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductsService } from './products.service';
import { CategoriesModule } from '../categories/categories.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), CategoriesModule, StockModule],
  providers: [ProductsService],
  exports: [TypeOrmModule, ProductsService],
})
export class ProductsModule {}
