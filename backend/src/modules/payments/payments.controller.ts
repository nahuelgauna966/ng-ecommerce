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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { HttpErrorResponseDto } from '../../common/dto/http-error-response.dto';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { CreatePaymentIntentResult, PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create')
  @ApiCreatedResponse({ description: 'Intento de pago creado correctamente.' })
  @ApiBadRequestResponse({
    description: 'El pedido no puede procesar un pago.',
    type: HttpErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Falta autenticación.',
    type: HttpErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El pedido no existe.',
    type: HttpErrorResponseDto,
  })
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
  @ApiOkResponse({ description: 'Evento de Stripe recibido correctamente.' })
  @ApiBadRequestResponse({
    description: 'Falta o es inválida la firma de Stripe.',
    type: HttpErrorResponseDto,
  })
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

