import { Repository } from 'typeorm';
import { Category } from '../categories/category.entity';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { Product } from './product.entity';
import { ProductsService } from './products.service';

describe('ProductsService catalog discovery', () => {
  const queryBuilder = {
    addOrderBy: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getRawMany: jest.fn(),
    groupBy: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  };
  const productsRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const service = new ProductsService(
    productsRepository as unknown as Repository<Product>,
    {} as Repository<Category>,
    {} as CloudinaryService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryBuilder.getMany.mockResolvedValue([]);
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
    queryBuilder.getRawMany.mockResolvedValue([]);
  });

  it('combines category, search, component, brand, visibility and stable pagination filters', async () => {
    const query = Object.assign(new PaginationQueryDto(), {
      page: 2,
      limit: 25,
      categoryId: 7,
      search: 'gpu',
      componentType: 'gpu',
      brand: 'AMD',
    });

    await service.findAllPaginated(query);

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'product.isActive = :isActive',
      { isActive: true },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'stock.quantity > :minimumStock',
      { minimumStock: 0 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'category.id = :categoryId',
      { categoryId: 7 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'LOWER(product.name) LIKE LOWER(:search)',
      { search: '%gpu%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'product.componentType = :componentType',
      { componentType: 'gpu' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'LOWER(product.brand) = LOWER(:brand)',
      { brand: 'AMD' },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'product.createdAt',
      'DESC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('product.id', 'DESC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(25);
    expect(queryBuilder.take).toHaveBeenCalledWith(25);
  });

  it('returns featured products with an explicit empty result and bounded query limit', async () => {
    queryBuilder.getMany.mockResolvedValue([]);

    const products = await service.findFeaturedProducts({ limit: 5 });

    expect(products).toEqual([]);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'product.isFeatured = :isFeatured',
      { isFeatured: true },
    );
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'product.createdAt',
      'DESC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('product.id', 'DESC');
  });

  it('orders newest products deterministically and limits the result', async () => {
    await service.findNewestProducts({ limit: 10 });

    expect(queryBuilder.take).toHaveBeenCalledWith(10);
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'product.createdAt',
      'DESC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('product.id', 'DESC');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'stock.quantity > :minimumStock',
      { minimumStock: 0 },
    );
  });

  it('returns distinct available brands in case-insensitive alphabetical order', async () => {
    queryBuilder.getRawMany.mockResolvedValue([
      { brand: 'AMD' },
      { brand: 'Nvidia' },
    ]);

    await expect(service.findAvailableBrands()).resolves.toEqual([
      'AMD',
      'Nvidia',
    ]);
    expect(queryBuilder.select).toHaveBeenCalledWith(
      'MIN(product.brand)',
      'brand',
    );
    expect(queryBuilder.groupBy).toHaveBeenCalledWith('LOWER(product.brand)');
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('normalizedBrand', 'ASC');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'stock.quantity > :minimumStock',
      { minimumStock: 0 },
    );
  });
});
