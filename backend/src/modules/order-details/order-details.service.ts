import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderDetail } from './order-detail.entity';

/**
 * Servicio interno usado por OrdersService/OrdersController. No expone
 * endpoints propios: los detalles de un pedido siempre se devuelven
 * embebidos en la respuesta del pedido (Order.orderDetails).
 */
@Injectable()
export class OrderDetailsService {
  constructor(
    @InjectRepository(OrderDetail)
    private readonly orderDetailsRepository: Repository<OrderDetail>,
  ) {}

  findByOrder(orderId: number): Promise<OrderDetail[]> {
    return this.orderDetailsRepository.find({
      where: { order: { id: orderId } },
      relations: { product: true },
    });
  }

  async findOne(id: number): Promise<OrderDetail> {
    const detail = await this.orderDetailsRepository.findOne({
      where: { id },
      relations: { product: true },
    });
    if (!detail) {
      throw new NotFoundException(
        `Detalle de pedido con id ${id} no encontrado`,
      );
    }
    return detail;
  }
}
