import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ComponentType } from '../product-component.types';
import { PaginationQueryDto } from './pagination-query.dto';
import { ProductDiscoveryQueryDto } from './product-discovery-query.dto';

describe('PaginationQueryDto catalog filters', () => {
  it('accepts component and brand filters and trims the brand', () => {
    const query = plainToInstance(PaginationQueryDto, {
      limit: '50',
      componentType: ComponentType.GPU,
      brand: '  AMD  ',
    });

    expect(validateSync(query)).toHaveLength(0);
    expect(query.limit).toBe(50);
    expect(query.brand).toBe('AMD');
  });

  it('rejects unsupported component types and limits above 50', () => {
    const query = plainToInstance(PaginationQueryDto, {
      limit: '51',
      componentType: 'processor',
    });

    const errors = validateSync(query);

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['limit', 'componentType']),
    );
  });
});

describe('ProductDiscoveryQueryDto', () => {
  it('defaults the limit to 10 and accepts the upper bound', () => {
    expect(plainToInstance(ProductDiscoveryQueryDto, {}).limit).toBe(10);
    const query = plainToInstance(ProductDiscoveryQueryDto, { limit: '50' });
    expect(validateSync(query)).toHaveLength(0);
    expect(query.limit).toBe(50);
  });

  it('rejects limits outside the supported range', () => {
    const tooLarge = plainToInstance(ProductDiscoveryQueryDto, { limit: '51' });
    const zero = plainToInstance(ProductDiscoveryQueryDto, { limit: '0' });

    expect(validateSync(tooLarge).map(({ property }) => property)).toContain(
      'limit',
    );
    expect(validateSync(zero).map(({ property }) => property)).toContain(
      'limit',
    );
  });
});
