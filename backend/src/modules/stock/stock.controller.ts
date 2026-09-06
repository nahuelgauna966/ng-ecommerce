import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  getStock(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<Stock> {
    return this.stockService.getStock(productId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':productId')
  updateStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateStockDto,
  ): Promise<Stock> {
    return this.stockService.updateStock(productId, dto.quantity);
  }
}
