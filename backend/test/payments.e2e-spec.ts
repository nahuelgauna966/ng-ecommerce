import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import Stripe from 'stripe';
import { E2E_BASE_URL } from './e2e-server.config';

dotenv.config();

interface AuthResponse {
  access_token?: string;
}

interface CategoryResponse {
  id?: number;
}

interface ProductResponse {
  id?: number;
}

interface OrderResponse {
  id?: number;
  status?: string;
  total?: number | string;
}

interface CreatePaymentIntentResponse {
  clientSecret?: string | null;
  message?: string;
}

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

/**
 * Test e2e del flujo completo de pagos (NE-52), corrido contra una
 * instancia real y compilada del backend (ver global-setup.ts) y contra la
 * API real de Stripe en modo test, igual que orders.e2e-spec.ts.
 *
 * El webhook de Stripe no se simula levantando `stripe listen`: se firma el
 * payload localmente con `stripe.webhooks.generateTestHeaderString`, usando
 * el mismo STRIPE_WEBHOOK_SECRET que usa el backend, y se lo postea
 * directamente a POST /payments/webhook.
 */
describe('Payments flow (e2e)', () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  const runId = Date.now();
  const customerEmail = `e2e-payments-customer-${runId}@test.com`;
  const otherCustomerEmail = `e2e-payments-other-${runId}@test.com`;
  const adminEmail = `e2e-payments-admin-${runId}@test.com`;
  const password = 'secret123';
  const categoryName = `E2E Payments Categoría ${runId}`;
  const productName = `E2E Payments Producto ${runId}`;
  const productPrice = 150;
  const productStock = 10;

  let customerToken: string;
  let otherCustomerToken: string;
  let adminToken: string;
  let productId: number;
  const createdOrderIds: number[] = [];

  async function createOrder(token: string): Promise<OrderResponse> {
    const res = await fetch(`${E2E_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: [{ productId, quantity: 1 }] }),
    });
    const body = await parseJson<OrderResponse>(res);
    createdOrderIds.push(body.id as number);
    return body;
  }

  async function getStripePaymentIntentId(orderId: number): Promise<string> {
    const res = await db.query(
      'SELECT "stripePaymentIntentId" FROM payments WHERE "orderId" = $1',
      [orderId],
    );
    return res.rows[0].stripePaymentIntentId as string;
  }

  async function postSignedWebhook(payload: Record<string, unknown>) {
    const rawBody = JSON.stringify(payload);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload: rawBody,
      secret: webhookSecret,
    });
    return fetch(`${E2E_BASE_URL}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: rawBody,
    });
  }

  beforeAll(async () => {
    await db.connect();

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO users (name, email, password, role, "isActive")
       VALUES ($1, $2, $3, 'admin', true)`,
      ['E2E Payments Admin', adminEmail, hashedPassword],
    );

    const adminLogin = await fetch(`${E2E_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password }),
    });
    adminToken = (await parseJson<AuthResponse>(adminLogin))
      .access_token as string;

    await fetch(`${E2E_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Payments Customer',
        email: customerEmail,
        password,
      }),
    });
    const customerLogin = await fetch(`${E2E_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerEmail, password }),
    });
    customerToken = (await parseJson<AuthResponse>(customerLogin))
      .access_token as string;

    await fetch(`${E2E_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Payments Other Customer',
        email: otherCustomerEmail,
        password,
      }),
    });
    const otherLogin = await fetch(`${E2E_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: otherCustomerEmail, password }),
    });
    otherCustomerToken = (await parseJson<AuthResponse>(otherLogin))
      .access_token as string;

    const categoryRes = await fetch(`${E2E_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: categoryName }),
    });
    const categoryId = (await parseJson<CategoryResponse>(categoryRes))
      .id as number;

    const productRes = await fetch(`${E2E_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: productName,
        price: productPrice,
        categoryId,
        initialStock: productStock,
      }),
    });
    productId = (await parseJson<ProductResponse>(productRes)).id as number;
  }, 20000);

  afterAll(async () => {
    if (createdOrderIds.length > 0) {
      await db.query('DELETE FROM orders WHERE id = ANY($1)', [
        createdOrderIds,
      ]);
    }
    await db.query('DELETE FROM products WHERE name = $1', [productName]);
    await db.query('DELETE FROM categories WHERE name = $1', [categoryName]);
    await db.query('DELETE FROM users WHERE email = ANY($1)', [
      [customerEmail, otherCustomerEmail, adminEmail],
    ]);
    await db.end();
  });

  describe('POST /payments/create', () => {
    it('rechaza la petición sin token', async () => {
      const res = await fetch(`${E2E_BASE_URL}/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 1 }),
      });
      expect(res.status).toBe(401);
    });

    it('rechaza un pedido inexistente con 404', async () => {
      const res = await fetch(`${E2E_BASE_URL}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ orderId: 999999999 }),
      });
      expect(res.status).toBe(404);
    });

    it('rechaza con 403 a quien no es dueño del pedido ni admin', async () => {
      const order = await createOrder(customerToken);

      const res = await fetch(`${E2E_BASE_URL}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${otherCustomerToken}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      expect(res.status).toBe(403);
    });

    it('crea un PaymentIntent real en Stripe (test mode) y devuelve el clientSecret', async () => {
      const order = await createOrder(customerToken);

      const res = await fetch(`${E2E_BASE_URL}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      const body = await parseJson<CreatePaymentIntentResponse>(res);

      expect(res.status).toBe(201);
      expect(body.clientSecret).toEqual(expect.stringContaining('_secret_'));

      const paymentIntentId = await getStripePaymentIntentId(order.id!);
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);
      expect(paymentIntent.amount).toBe(
        Math.round(Number(order.total) * 100),
      );
      expect(paymentIntent.currency).toBe('usd');
    });

    it('rechaza con 400 si el pedido ya tiene un pago asociado', async () => {
      const order = await createOrder(customerToken);

      await fetch(`${E2E_BASE_URL}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });

      const res = await fetch(`${E2E_BASE_URL}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /payments/webhook', () => {
    it('rechaza con 400 una firma inválida', async () => {
      const res = await fetch(`${E2E_BASE_URL}/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 't=123,v1=firma-invalida',
        },
        body: JSON.stringify({ type: 'payment_intent.succeeded' }),
      });
      expect(res.status).toBe(400);
    });

    it(
      'marca el pago como completed y confirma el pedido en payment_intent.succeeded',
      async () => {
        const order = await createOrder(customerToken);
        await fetch(`${E2E_BASE_URL}/payments/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({ orderId: order.id }),
        });
        const paymentIntentId = await getStripePaymentIntentId(order.id!);

        const res = await postSignedWebhook({
          id: `evt_test_${runId}_succeeded`,
          object: 'event',
          type: 'payment_intent.succeeded',
          data: { object: { id: paymentIntentId, object: 'payment_intent' } },
        });
        expect(res.status).toBe(200);

        const paymentRow = await db.query(
          'SELECT status FROM payments WHERE "orderId" = $1',
          [order.id],
        );
        const orderRow = await db.query(
          'SELECT status FROM orders WHERE id = $1',
          [order.id],
        );
        expect(paymentRow.rows[0].status).toBe('completed');
        expect(orderRow.rows[0].status).toBe('confirmed');
      },
      15000,
    );

    it(
      'marca el pago como failed y deja el pedido en pending en payment_intent.payment_failed',
      async () => {
        const order = await createOrder(customerToken);
        await fetch(`${E2E_BASE_URL}/payments/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({ orderId: order.id }),
        });
        const paymentIntentId = await getStripePaymentIntentId(order.id!);

        const res = await postSignedWebhook({
          id: `evt_test_${runId}_failed`,
          object: 'event',
          type: 'payment_intent.payment_failed',
          data: { object: { id: paymentIntentId, object: 'payment_intent' } },
        });
        expect(res.status).toBe(200);

        const paymentRow = await db.query(
          'SELECT status FROM payments WHERE "orderId" = $1',
          [order.id],
        );
        const orderRow = await db.query(
          'SELECT status FROM orders WHERE id = $1',
          [order.id],
        );
        expect(paymentRow.rows[0].status).toBe('failed');
        expect(orderRow.rows[0].status).toBe('pending');
      },
      15000,
    );
  });
});
