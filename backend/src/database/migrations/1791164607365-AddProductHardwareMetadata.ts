import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductHardwareMetadata1791164607365 implements MigrationInterface {
  name = 'AddProductHardwareMetadata1791164607365';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" ADD "brand" character varying(100)',
    );
    await queryRunner.query(
      'ALTER TABLE "products" ADD "componentType" character varying(30)',
    );
    await queryRunner.query('ALTER TABLE "products" ADD "hardwareSpecs" jsonb');
    await queryRunner.query(
      'ALTER TABLE "products" ADD "isFeatured" boolean NOT NULL DEFAULT false',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "products" DROP COLUMN "isFeatured"');
    await queryRunner.query(
      'ALTER TABLE "products" DROP COLUMN "hardwareSpecs"',
    );
    await queryRunner.query(
      'ALTER TABLE "products" DROP COLUMN "componentType"',
    );
    await queryRunner.query('ALTER TABLE "products" DROP COLUMN "brand"');
  }
}
