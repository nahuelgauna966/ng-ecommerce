import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
}
