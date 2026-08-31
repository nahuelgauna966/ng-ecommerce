import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { StockModule } from './modules/stock/stock.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { OrderDetailsModule } from './modules/order-details/order-details.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    // Carga las variables de entorno desde .env y las hace disponibles globalmente
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),

    // Conexión a PostgreSQL (Neon) usando la config centralizada
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
        configService.get<TypeOrmModuleOptions>('database')!,
    }),

    // Módulos de negocio
    CategoriesModule,
    ProductsModule,
    StockModule,
    UsersModule,
    OrdersModule,
    OrderDetailsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
