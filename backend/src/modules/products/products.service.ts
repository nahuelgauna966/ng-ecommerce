import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Category } from '../categories/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  findAll(): Promise<Product[]> {
    return this.productsRepository.find({
      relations: { category: true, stock: true },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { category: true, stock: true },
    });
    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return product;
  }

  private async findCategoryOrFail(categoryId: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(
        `Categoría con id ${categoryId} no encontrada`,
      );
    }
    return category;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const { categoryId, initialStock, ...rest } = dto;

    const category = categoryId
      ? await this.findCategoryOrFail(categoryId)
      : undefined;

    const product = this.productsRepository.create({
      ...rest,
      category,
      stock: { quantity: initialStock ?? 0 },
    });

    const saved = await this.productsRepository.save(product);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const { categoryId, initialStock, ...rest } = dto;

    if (categoryId !== undefined) {
      product.category = await this.findCategoryOrFail(categoryId);
    }

    Object.assign(product, rest);
    await this.productsRepository.save(product);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }
}
