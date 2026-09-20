import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProcessingOrderStatus1788626433992
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TYPE \"orders_status_enum\" ADD VALUE IF NOT EXISTS 'processing'",
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing a value from an enum safely.
  }
}