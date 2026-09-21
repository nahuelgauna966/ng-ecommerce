import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { HttpErrorResponseDto } from '../../common/dto/http-error-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { UserRole } from '../users/user.entity';
import { OrdersService, PaginatedAdminOrders } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import { Order } from './order.entity';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Listar pedidos con filtros (solo admin)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de pedidos.' })
  @ApiUnauthorizedResponse({
    description: 'Falta autenticación.',
    type: HttpErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol admin.',
    type: HttpErrorResponseDto,
  })
  findAllForAdmin(
    @Query() query: AdminOrdersQueryDto,
  ): Promise<PaginatedAdminOrders> {
    return this.ordersService.findAllForAdmin(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  @ApiOperation({ summary: 'Listar los pedidos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos del usuario.' })
  @ApiUnauthorizedResponse({
    description: 'Falta autenticación.',
    type: HttpErrorResponseDto,
  })
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
    type: HttpErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Algún producto no existe.',
    type: HttpErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Falta autenticación.',
    type: HttpErrorResponseDto,
  })
  create(
    @CurrentUser('sub') userId: number,
    @Body() dto: CreateOrderDto,
  ): Promise<Order> {
    return this.ordersService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Ver el detalle completo de un pedido' })
  @ApiParam({ name: 'id', example: 1, description: 'Id del pedido.' })
  @ApiResponse({ status: 200, description: 'Detalle del pedido.' })
  @ApiResponse({
    status: 403,
    description:
      'El pedido pertenece a otro usuario y quien pregunta no es admin.',
    type: HttpErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'El pedido no existe.',
    type: HttpErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Falta autenticación.',
    type: HttpErrorResponseDto,
  })
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
  @ApiParam({ name: 'id', example: 1, description: 'Id del pedido.' })
  @ApiResponse({
    status: 200,
    description: 'Pedido con el estado actualizado.',
  })
  @ApiResponse({
    status: 400,
    description: 'Transición de estado inválida (ej: delivered -> pending).',
    type: HttpErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'El pedido no existe.',
    type: HttpErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Falta autenticación.',
    type: HttpErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol admin.',
    type: HttpErrorResponseDto,
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, dto);
  }
}
