import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { E2E_BASE_URL } from './e2e-server.config';

dotenv.config();

interface AuthResponse {
  access_token?: string;
}

interface CategoryResponse {
  id?: number;
  name?: string;
}

interface ProductResponse {
  id?: number;
  name?: string;
  price?: number | string;
}

interface StockResponse {
  quantity?: number;
}

interface OrderDetailResponse {
  id?: number;
  quantity?: number;
  unitPrice?: number | string;
  product?: { id?: number; name?: string };
}

interface OrderResponse {
  id?: number;
  status?: string;
  total?: number | string;
  orderDetails?: OrderDetailResponse[];
  message?: string;
}

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

/**
 * Test e2e del flujo completo de pedidos (NE-45), corrido contra una
 * instancia real y compilada del backend (ver global-setup.ts), igual que
 * auth.e2e-spec.ts.
 */
describe('Orders flow (e2e)', () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });

  const runId = Date.now();
  const customerEmail = `e2e-orders-customer-${runId}@test.com`;
  const otherCustomerEmail = `e2e-orders-other-${runId}@test.com`;
  const adminEmail = `e2e-orders-admin-${runId}@test.com`;
  const password = 'secret123';
  const categoryName = `E2E Orders Categoría ${runId}`;
  const productAName = `E2E Producto A ${runId}`;
  const productBName = `E2E Producto B ${runId}`;

  const productAStock = 5;
  const productBStock = 3;
  const productAPrice = 100;
  const productBPrice = 50;

  let customerToken: string;
  let otherCustomerToken: string;
  let adminToken: string;
  let productAId: number;
  let productBId: number;
  let createdOrderId: number;

  beforeAll(async () => {
    await db.connect();

    // Admin sembrado directo en la DB (no hay endpoint público para
    // auto-asignarse ese rol).
    // auto-asignarse ese rol).
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO users (name, email, password, role, "isActive")
       VALUES ($1, $2, $3, 'admin', true)`,
      ['E2E Orders Admin', adminEmail, hashedPassword],
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
        name: 'E2E Orders Customer',
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
        name: 'E2E Orders Other Customer',
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

    const productARes = await fetch(`${E2E_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: productAName,
        price: productAPrice,
        categoryId,
        initialStock: productAStock,
      }),
    });
    productAId = (await parseJson<ProductResponse>(productARes)).id as number;

    const productBRes = await fetch(`${E2E_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: productBName,
        price: productBPrice,
        categoryId,
        initialStock: productBStock,
      }),
    });
    productBId = (await parseJson<ProductResponse>(productBRes)).id as number;
  }, 20000);

  afterAll(async () => {
    if (typeof createdOrderId === 'number') {
      await db.query('DELETE FROM orders WHERE id = $1', [createdOrderId]);
    }
    await db.query('DELETE FROM products WHERE name = ANY($1)', [
      [productAName, productBName],
    ]);
    await db.query('DELETE FROM categories WHERE name = $1', [categoryName]);
    await db.query('DELETE FROM users WHERE email = ANY($1)', [
      [customerEmail, otherCustomerEmail, adminEmail],
    ]);
    await db.end();
  });

  describe('POST /orders', () => {
    it('crea un pedido con status pending y calcula el total correctamente', async () => {
      const res = await fetch(`${E2E_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          items: [
            { productId: productAId, quantity: 2 },
            { productId: productBId, quantity: 1 },
          ],
        }),
      });
      const body = await parseJson<OrderResponse>(res);

      expect(res.status).toBe(201);
      expect(body.status).toBe('pending');
      expect(Number(body.total)).toBe(productAPrice * 2 + productBPrice * 1);
      expect(body.orderDetails).toHaveLength(2);

      createdOrderId = body.id as number;
    });

    it('descuenta el stock de cada producto pedido', async () => {
      const stockA = await fetch(`${E2E_BASE_URL}/stock/${productAId}`);
      const stockB = await fetch(`${E2E_BASE_URL}/stock/${productBId}`);

      const bodyA = await parseJson<StockResponse>(stockA);
      const bodyB = await parseJson<StockResponse>(stockB);

      expect(bodyA.quantity).toBe(productAStock - 2);
      expect(bodyB.quantity).toBe(productBStock - 1);
    });

    it('rechaza el pedido si el stock es insuficiente', async () => {
      const res = await fetch(`${E2E_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          items: [{ productId: productBId, quantity: 999 }],
        }),
      });
      expect(res.status).toBe(400);
    });

    it('rechaza el pedido si algún producto no existe', async () => {
      const res = await fetch(`${E2E_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          items: [{ productId: 999999999, quantity: 1 }],
        }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /orders/my-orders', () => {
    it('devuelve el pedido recién creado para su dueño', async () => {
      const res = await fetch(`${E2E_BASE_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const body = await parseJson<OrderResponse[]>(res);

      expect(res.status).toBe(200);
      expect(body.some((order) => order.id === createdOrderId)).toBe(true);
    });
  });

  describe('GET /orders/:id', () => {
    it('devuelve el detalle completo con orderDetails y productos para el dueño', async () => {
      const res = await fetch(`${E2E_BASE_URL}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const body = await parseJson<OrderResponse>(res);

      expect(res.status).toBe(200);
      expect(body.orderDetails).toHaveLength(2);
      expect(body.orderDetails?.[0].product?.id).toBeDefined();
    });

    it('rechaza con 403 a otro usuario que no es dueño ni admin', async () => {
      const res = await fetch(`${E2E_BASE_URL}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${otherCustomerToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('permite a un admin ver cualquier pedido', async () => {
      const res = await fetch(`${E2E_BASE_URL}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('rechaza a un customer con 403 (RolesGuard admin-only)', async () => {
      const res = await fetch(
        `${E2E_BASE_URL}/orders/${createdOrderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify({ status: 'confirmed' }),
        },
      );
      expect(res.status).toBe(403);
    });

    it('permite a un admin cambiar el estado a confirmed', async () => {
      const res = await fetch(
        `${E2E_BASE_URL}/orders/${createdOrderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ status: 'confirmed' }),
        },
      );
      const body = await parseJson<OrderResponse>(res);

      expect(res.status).toBe(200);
      expect(body.status).toBe('confirmed');
    });

    it('rechaza una transición de estado inválida (confirmed -> pending)', async () => {
      const res = await fetch(
        `${E2E_BASE_URL}/orders/${createdOrderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ status: 'pending' }),
        },
      );
      expect(res.status).toBe(400);
    });
  });
});
