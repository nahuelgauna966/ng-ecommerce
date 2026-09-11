import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import {
  CreatePaymentIntentResult,
  PaymentsService,
} from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create')
  createPaymentIntent(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<CreatePaymentIntentResult> {
    return this.paymentsService.createPaymentIntent(dto.orderId, currentUser);
  }

  /**
   * Recibido directamente por Stripe (no por un usuario logueado): no lleva
   * JwtAuthGuard. La autenticidad se garantiza verificando la firma del
   * request con el secreto del webhook (constructWebhookEvent).
   */
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: true }> {
    if (!req.rawBody || !signature) {
      throw new BadRequestException(
        'Falta el body crudo o la firma del webhook',
      );
    }

    let event;
    try {
      event = this.paymentsService.constructWebhookEvent(
        req.rawBody,
        signature,
      );
    } catch {
      throw new BadRequestException('Firma de webhook inválida');
    }

    await this.paymentsService.handleWebhookEvent(event);
    return { received: true };
  }
}

