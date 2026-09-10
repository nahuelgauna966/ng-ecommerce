import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Payment, PaymentMethod, PaymentStatus } from './payment.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import { UserRole } from '../users/user.entity';
import { JwtPayload } from '../auth/auth.service';
import { StripeConfig } from '../../config/stripe.config';

export interface CreatePaymentIntentResult {
  clientSecret: string | null;
}

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly currency: string;
  private readonly webhookSecret: string;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly configService: ConfigService,
  ) {
    const stripeConfig = this.configService.get<StripeConfig>('stripe')!;
    this.stripe = new Stripe(stripeConfig.secretKey);
    this.currency = stripeConfig.currency;
    this.webhookSecret = stripeConfig.webhookSecret;
  }

  /**
   * Crea un PaymentIntent en Stripe para un pedido y guarda el Payment
   * pendiente asociado. Solo el dueño del pedido (o un admin) puede pagarlo.
   */
  async createPaymentIntent(
    orderId: number,
    currentUser: JwtPayload,
  ): Promise<CreatePaymentIntentResult> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { user: true, payment: true },
    });
    if (!order) {
      throw new NotFoundException(`Pedido con id ${orderId} no encontrado`);
    }

    const isAdmin = (currentUser.role as UserRole) === UserRole.ADMIN;
    const isOwner = order.user?.id === currentUser.sub;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('No tenés permiso para pagar este pedido');
    }

    if (order.payment) {
      throw new BadRequestException('Este pedido ya tiene un pago asociado');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(Number(order.total) * 100),
      currency: this.currency,
      metadata: { orderId: String(order.id) },
    });

    const payment = this.paymentRepository.create({
      amount: order.total,
      status: PaymentStatus.PENDING,
      method: PaymentMethod.CARD,
      stripePaymentIntentId: paymentIntent.id,
      order,
    });
    await this.paymentRepository.save(payment);

    return { clientSecret: paymentIntent.client_secret };
  }

  /**
   * Verifica la firma del webhook y devuelve el evento de Stripe ya validado.
   * Lanza si la firma no es válida (el controller responde 400).
   */
  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );
  }

  /**
   * Procesa un evento de Stripe ya verificado: actualiza el estado del Payment
   * y, si el pago se completó, confirma el pedido.
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.markPaymentCompleted(
          (event.data.object as Stripe.PaymentIntent).id,
        );
        break;
      case 'payment_intent.payment_failed':
        await this.markPaymentFailed(
          (event.data.object as Stripe.PaymentIntent).id,
        );
        break;
      default:
        // Otros tipos de evento no nos interesan: se acusa recibo sin acción.
        break;
    }
  }

  private async findPaymentByIntentId(
    paymentIntentId: string,
  ): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
      relations: { order: true },
    });
  }

  private async markPaymentCompleted(paymentIntentId: string): Promise<void> {
    const payment = await this.findPaymentByIntentId(paymentIntentId);
    if (!payment) {
      return;
    }

    payment.status = PaymentStatus.COMPLETED;
    await this.paymentRepository.save(payment);

    if (payment.order.status === OrderStatus.PENDING) {
      payment.order.status = OrderStatus.CONFIRMED;
      await this.orderRepository.save(payment.order);
    }
  }

  private async markPaymentFailed(paymentIntentId: string): Promise<void> {
    const payment = await this.findPaymentByIntentId(paymentIntentId);
    if (!payment) {
      return;
    }

    payment.status = PaymentStatus.FAILED;
    await this.paymentRepository.save(payment);
  }
}
