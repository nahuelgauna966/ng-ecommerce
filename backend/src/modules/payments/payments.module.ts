import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { Order } from '../orders/order.entity';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order])],
  providers: [PaymentsService],
  exports: [TypeOrmModule, PaymentsService],
})
export class PaymentsModule {}
