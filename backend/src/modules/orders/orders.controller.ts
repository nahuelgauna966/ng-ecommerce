import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.entity';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  @ApiOperation({ summary: 'Listar los pedidos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos del usuario.' })
  findMyOrders(@CurrentUser('sub') userId: number): Promise<Order[]> {
    return this.ordersService.findByUser(userId);
  }

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

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Ver el detalle completo de un pedido' })
  @ApiResponse({ status: 200, description: 'Detalle del pedido.' })
  @ApiResponse({
    status: 403,
    description:
      'El pedido pertenece a otro usuario y quien pregunta no es admin.',
  })
  @ApiResponse({ status: 404, description: 'El pedido no existe.' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<Order> {
    return this.ordersService.findOne(id, user);
  }
}
