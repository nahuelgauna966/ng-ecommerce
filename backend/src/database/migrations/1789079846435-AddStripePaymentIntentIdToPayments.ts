import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Agrega la columna stripePaymentIntentId a payments: guarda el id del
 * PaymentIntent de Stripe asociado, necesario para poder mapear los eventos
 * del webhook (payment_intent.succeeded / payment_intent.payment_failed) de
 * vuelta al Payment/Order correspondiente (NE-46/BE-43).
 */
export class AddStripePaymentIntentIdToPayments1789079846435 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ADD "stripePaymentIntentId" character varying`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "UQ_payments_stripePaymentIntentId" UNIQUE ("stripePaymentIntentId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "UQ_payments_stripePaymentIntentId"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "stripePaymentIntentId"`);
    }

}
