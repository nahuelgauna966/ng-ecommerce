import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { OrderDetail } from '../order-details/order-detail.entity';
import { OrderDetailsService } from '../order-details/order-details.service';
import { Product } from '../products/product.entity';
import { Stock } from '../stock/stock.entity';
import { UserRole } from '../users/user.entity';
import { JwtPayload } from '../auth/auth.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  /**
   * Transiciones de estado permitidas. 'delivered' y 'cancelled' son
   * terminales: una vez ahí, el pedido no puede volver a cambiar de estado.
   */
  private static readonly ALLOWED_TRANSITIONS: Record<
    OrderStatus,
    OrderStatus[]
  > = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
  };

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly orderDetailsService: OrderDetailsService,
  ) {}

  /**
   * Crea un pedido de forma atómica: valida existencia y stock de cada
   * producto, calcula el total, descuenta stock y genera los OrderDetail.
   * Todo dentro de una transacción para evitar inconsistencias si algo falla
   * a mitad de camino.
   */
  async create(userId: number, dto: CreateOrderDto): Promise<Order> {
    const orderId = await this.dataSource.transaction(async (manager) => {
      const productRepository = manager.getRepository(Product);
      const stockRepository = manager.getRepository(Stock);
      const orderRepository = manager.getRepository(Order);
      const orderDetailRepository = manager.getRepository(OrderDetail);

      // Suma las cantidades pedidas por producto, por si el mismo producto
      // aparece en más de un item del pedido.
      const requestedQuantityByProduct = new Map<number, number>();
      for (const item of dto.items) {
        requestedQuantityByProduct.set(
          item.productId,
          (requestedQuantityByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }

      const productsById = new Map<number, Product>();
      for (const productId of requestedQuantityByProduct.keys()) {
        const product = await productRepository.findOne({
          where: { id: productId },
          relations: { stock: true },
        });
        if (!product) {
          throw new NotFoundException(
            `Producto con id ${productId} no encontrado`,
          );
        }

        const requestedQuantity = requestedQuantityByProduct.get(productId)!;
        if (!product.stock || product.stock.quantity < requestedQuantity) {
          throw new BadRequestException(
            `Stock insuficiente para el producto "${product.name}"`,
          );
        }

        productsById.set(productId, product);
      }

      let total = 0;
      for (const item of dto.items) {
        const product = productsById.get(item.productId)!;
        total += Number(product.price) * item.quantity;
      }

      const order = orderRepository.create({
        status: OrderStatus.PENDING,
        total,
        user: { id: userId },
      });
      const savedOrder = await orderRepository.save(order);

      for (const item of dto.items) {
        const product = productsById.get(item.productId)!;
        await stockRepository.decrement(
          { id: product.stock.id },
          'quantity',
          item.quantity,
        );

        const orderDetail = orderDetailRepository.create({
          order: savedOrder,
          product,
          quantity: item.quantity,
          unitPrice: product.price,
        });
        await orderDetailRepository.save(orderDetail);
      }

      return savedOrder.id;
    });

    return this.getOrderOrFail(orderId);
  }

  private async getOrderOrFail(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { user: true, payment: true },
    });
    if (!order) {
      throw new NotFoundException(`Pedido con id ${id} no encontrado`);
    }
    order.orderDetails = await this.orderDetailsService.findByOrder(id);
    return order;
  }

  /**
   * Pedidos del usuario autenticado, con sus orderDetails y productos,
   * ordenados por fecha de creación descendente (más recientes primero).
   */
  findByUser(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: { orderDetails: { product: true } },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Detalle completo de un pedido. El dueño del pedido puede verlo; un admin
   * puede ver cualquiera. Los datos del usuario (nombre, email) solo se
   * incluyen en la respuesta si quien pregunta es admin.
   */
  async findOne(id: number, currentUser: JwtPayload): Promise<Order> {
    const order = await this.getOrderOrFail(id);

    const isAdmin = (currentUser.role as UserRole) === UserRole.ADMIN;
    const isOwner = order.user?.id === currentUser.sub;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('No tenés permiso para ver este pedido');
    }

    if (!isAdmin) {
      delete (order as { user?: unknown }).user;
    }

    return order;
  }

  /**
   * Cambia el estado de un pedido (solo admin, validado por RolesGuard en el
   * controller). Rechaza transiciones que no tengan sentido en el ciclo de
   * vida del pedido (ej: 'delivered' -> 'pending').
   */
  async updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Pedido con id ${id} no encontrado`);
    }

    const allowedNextStatuses = OrdersService.ALLOWED_TRANSITIONS[order.status];
    if (!allowedNextStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `No se puede pasar el pedido de '${order.status}' a '${dto.status}'`,
      );
    }

    order.status = dto.status;
    await this.orderRepository.save(order);
    return this.getOrderOrFail(id);
  }
}
