import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { UserRole } from '../users/user.entity';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar el estado de un pedido (solo admin)' })
  @ApiResponse({
    status: 200,
    description: 'Pedido con el estado actualizado.',
  })
  @ApiResponse({
    status: 400,
    description: 'Transición de estado inválida (ej: delivered -> pending).',
  })
  @ApiResponse({ status: 404, description: 'El pedido no existe.' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, dto);
  }
}
