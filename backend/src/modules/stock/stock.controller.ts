import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { StockService } from './stock.service';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Stock } from './stock.entity';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get(':productId')
  getStock(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<Stock> {
    return this.stockService.getStock(productId);
  }

  @Patch(':productId')
  updateStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateStockDto,
  ): Promise<Stock> {
    return this.stockService.updateStock(productId, dto.quantity);
  }
}
