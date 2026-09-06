import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migración baseline. El esquema (tablas categories, products, stock, users,
 * orders, order_details, payments) ya fue creado durante el Sprint 1 mediante
 * `synchronize: true` en el entorno de desarrollo (Neon). Esta migración no
 * ejecuta DDL: su único propósito es dejar un registro en la tabla
 * `migrations` que marque el punto de partida a partir del cual, de ahora en
 * más, todo cambio de esquema se gestiona con migraciones reales
 * (`synchronize` queda deshabilitado, ver database.config.ts).
 */
export class InitialSchema1788626433991 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // No-op: el esquema ya existe (creado por synchronize en Sprint 1).
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No-op: no hay nada que revertir en esta migración baseline.
    }

}
