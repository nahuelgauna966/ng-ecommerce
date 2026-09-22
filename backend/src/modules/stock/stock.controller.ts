import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { HttpErrorResponseDto } from '../../common/dto/http-error-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { StockService } from './stock.service';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Stock } from './stock.entity';

@ApiTags('stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get(':productId')
  @ApiParam({ name: 'productId', example: 1, description: 'Id del producto.' })
  @ApiOkResponse({ description: 'Stock del producto.' })
  @ApiNotFoundResponse({
    description: 'El producto o su stock no existe.',
    type: HttpErrorResponseDto,
  })
  getStock(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<Stock> {
    return this.stockService.getStock(productId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':productId')
  @ApiParam({ name: 'productId', example: 1, description: 'Id del producto.' })
  @ApiOkResponse({ description: 'Stock actualizado correctamente.' })
  @ApiBadRequestResponse({
    description: 'La cantidad enviada no es válida.',
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
  @ApiNotFoundResponse({
    description: 'El producto o su stock no existe.',
    type: HttpErrorResponseDto,
  })
  updateStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateStockDto,
  ): Promise<Stock> {
    return this.stockService.updateStock(productId, dto.quantity);
  }
}
