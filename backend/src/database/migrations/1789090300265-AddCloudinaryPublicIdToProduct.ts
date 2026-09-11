import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCloudinaryPublicIdToProduct1789090300265 implements MigrationInterface {
    name = 'AddCloudinaryPublicIdToProduct1789090300265'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "cloudinaryPublicId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "cloudinaryPublicId"`);
    }

}
