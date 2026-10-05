import type { QueryRunner } from 'typeorm';
import { AddProductHardwareMetadata1791164607365 } from '../migrations/1791164607365-AddProductHardwareMetadata';

describe('AddProductHardwareMetadata1791164607365', () => {
  it('adds nullable metadata columns and a safe false default for existing products', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddProductHardwareMetadata1791164607365();

    await migration.up({ query } as unknown as QueryRunner);

    expect(query).toHaveBeenCalledTimes(4);
    expect(query).toHaveBeenCalledWith(
      'ALTER TABLE "products" ADD "brand" character varying(100)',
    );
    expect(query).toHaveBeenCalledWith(
      'ALTER TABLE "products" ADD "componentType" character varying(30)',
    );
    expect(query).toHaveBeenCalledWith(
      'ALTER TABLE "products" ADD "hardwareSpecs" jsonb',
    );
    expect(query).toHaveBeenCalledWith(
      'ALTER TABLE "products" ADD "isFeatured" boolean NOT NULL DEFAULT false',
    );
  });

  it('drops the added columns in reverse order', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddProductHardwareMetadata1791164607365();

    await migration.down({ query } as unknown as QueryRunner);

    expect(query.mock.calls.map(([sql]) => String(sql))).toEqual([
      'ALTER TABLE "products" DROP COLUMN "isFeatured"',
      'ALTER TABLE "products" DROP COLUMN "hardwareSpecs"',
      'ALTER TABLE "products" DROP COLUMN "componentType"',
      'ALTER TABLE "products" DROP COLUMN "brand"',
    ]);
  });
});
