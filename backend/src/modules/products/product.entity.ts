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
import { Category } from '../categories/category.entity';
import { Stock } from '../stock/stock.entity';
import { OrderDetail } from '../order-details/order-detail.entity';
import type { ComponentType, HardwareSpecs } from './product-component.types';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ nullable: true })
  imageUrl!: string;

  @Column({ nullable: true })
  cloudinaryPublicId!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true, length: 100 })
  brand!: string | null;

  @Column({ nullable: true, length: 30 })
  componentType!: ComponentType | null;

  @Column({ type: 'jsonb', nullable: true })
  hardwareSpecs!: HardwareSpecs | null;

  @Column({ default: false })
  isFeatured!: boolean;

  @ManyToOne(() => Category, (category: Category) => category.products, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  category!: Category;

  @OneToOne(() => Stock, (stock: Stock) => stock.product, { cascade: true })
  stock!: Stock;

  @OneToMany(
    () => OrderDetail,
    (orderDetail: OrderDetail) => orderDetail.product,
  )
  orderDetails!: OrderDetail[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
