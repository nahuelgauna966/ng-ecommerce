import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { OrderDetail } from '../order-details/order-detail.entity';
import { Payment } from '../payments/payment.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  @ManyToOne(() => User, (user: User) => user.orders, { onDelete: 'SET NULL', nullable: true })
  user!: User;

  @OneToMany(() => OrderDetail, (orderDetail: OrderDetail) => orderDetail.order, { cascade: true })
  orderDetails!: OrderDetail[];

  @OneToOne(() => Payment, (payment: Payment) => payment.order, { cascade: true })
  payment!: Payment;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
