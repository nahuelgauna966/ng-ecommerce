import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from './stock.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
  ) {}

  async getStock(productId: number): Promise<Stock> {
    const stock = await this.stockRepository.findOne({
      where: { product: { id: productId } },
      relations: { product: true },
    });
    if (!stock) {
      throw new NotFoundException(
        `Stock para el producto con id ${productId} no encontrado`,
      );
    }
    return stock;
  }

  async updateStock(productId: number, quantity: number): Promise<Stock> {
    const stock = await this.getStock(productId);
    stock.quantity = quantity;
    return this.stockRepository.save(stock);
  }
}
