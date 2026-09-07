import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.entity';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Crear un pedido a partir de una lista de productos y cantidades',
  })
  @ApiResponse({ status: 201, description: 'Pedido creado correctamente.' })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente para algún producto.',
  })
  @ApiResponse({ status: 404, description: 'Algún producto no existe.' })
  create(
    @CurrentUser('sub') userId: number,
    @Body() dto: CreateOrderDto,
  ): Promise<Order> {
    return this.ordersService.create(userId, dto);
  }
}
