import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from './product.entity';
import { Category } from '../categories/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { ProductDiscoveryQueryDto } from './dto/product-discovery-query.dto';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  findAll(): Promise<Product[]> {
    return this.productsRepository.find({
      relations: { category: true, stock: true },
    });
  }

  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Product>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.stock', 'stock')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('stock.quantity > :minimumStock', { minimumStock: 0 })
      .orderBy('product.createdAt', 'DESC')
      .addOrderBy('product.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.search) {
      queryBuilder.andWhere('LOWER(product.name) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.componentType) {
      queryBuilder.andWhere('product.componentType = :componentType', {
        componentType: query.componentType,
      });
    }

    if (query.brand) {
      queryBuilder.andWhere('LOWER(product.brand) = LOWER(:brand)', {
        brand: query.brand,
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  findFeaturedProducts(query: ProductDiscoveryQueryDto): Promise<Product[]> {
    return this.createPublicDiscoveryQueryBuilder()
      .andWhere('product.isFeatured = :isFeatured', { isFeatured: true })
      .orderBy('product.createdAt', 'DESC')
      .addOrderBy('product.id', 'DESC')
      .take(query.limit)
      .getMany();
  }

  findNewestProducts(query: ProductDiscoveryQueryDto): Promise<Product[]> {
    return this.createPublicDiscoveryQueryBuilder()
      .orderBy('product.createdAt', 'DESC')
      .addOrderBy('product.id', 'DESC')
      .take(query.limit)
      .getMany();
  }

  async findAvailableBrands(): Promise<string[]> {
    const rows = await this.productsRepository
      .createQueryBuilder('product')
      .select('MIN(product.brand)', 'brand')
      .addSelect('LOWER(product.brand)', 'normalizedBrand')
      .innerJoin('product.stock', 'stock')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('stock.quantity > :minimumStock', { minimumStock: 0 })
      .andWhere('product.brand IS NOT NULL')
      .andWhere("TRIM(product.brand) <> ''")
      .groupBy('LOWER(product.brand)')
      .orderBy('normalizedBrand', 'ASC')
      .addOrderBy('brand', 'ASC')
      .getRawMany<{ brand: string }>();

    return rows.map(({ brand }) => brand.trim());
  }

  private createPublicDiscoveryQueryBuilder(): SelectQueryBuilder<Product> {
    return this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .innerJoinAndSelect('product.stock', 'stock')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('stock.quantity > :minimumStock', { minimumStock: 0 });
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
    const { categoryId, ...rest } = dto;

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

  async updateImage(id: number, file: Express.Multer.File): Promise<Product> {
    const product = await this.findOne(id);

    if (product.cloudinaryPublicId) {
      await this.cloudinaryService.deleteImage(product.cloudinaryPublicId);
    }

    const result = await this.cloudinaryService.uploadImage(file, 'products');
    product.imageUrl = result.secure_url;
    product.cloudinaryPublicId = result.public_id;

    await this.productsRepository.save(product);
    return this.findOne(id);
  }
}
