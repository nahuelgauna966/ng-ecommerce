import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { E2E_BASE_URL } from './e2e-server.config';

dotenv.config();

// Forma mínima de las respuestas JSON que nos interesan verificar. Evita
// que `res.json()` (tipado `any` por el DOM lib) dispare los lint rules
// no-unsafe-assignment / no-unsafe-member-access.
interface ApiResponse {
  access_token?: string;
  message?: string;
  email?: string;
  name?: string;
  password?: string;
  role?: string;
}

async function parseJson(res: Response): Promise<ApiResponse> {
  return (await res.json()) as ApiResponse;
}

/**
 * Test e2e del flujo completo de autenticación, corrido contra una
 * instancia real y compilada del backend (ver global-setup.ts) en vez de
 * bootear la app dentro del proceso de Jest — necesario porque algunas
 * dependencias (@nestjs/passport, @nestjs/mapped-types) son ESM puro y
 * rompen el `require()` de ts-jest si se intenta importar AppModule
 * directamente en un test.
 */
describe('Auth flow (e2e)', () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });

  const runId = Date.now();
  const customerEmail = `e2e-customer-${runId}@test.com`;
  const adminEmail = `e2e-admin-${runId}@test.com`;
  const duplicateEmail = `e2e-duplicate-${runId}@test.com`;
  const password = 'secret123';
  const testCategoryName = `E2E Categoría Admin ${runId}`;

  let customerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await db.connect();

    // Se siembra un usuario admin directo en la DB: no existe (a
    // propósito) un endpoint público que permita auto-asignarse ese rol.
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO users (name, email, password, role, "isActive")
       VALUES ($1, $2, $3, 'admin', true)`,
      ['E2E Admin', adminEmail, hashedPassword],
    );
  });

  afterAll(async () => {
    await db.query('DELETE FROM categories WHERE name = $1', [
      testCategoryName,
    ]);
    await db.query('DELETE FROM users WHERE email = ANY($1)', [
      [customerEmail, adminEmail, duplicateEmail],
    ]);
    await db.end();
  });

  describe('POST /auth/register', () => {
    it('registra un usuario nuevo con rol customer por defecto y sin exponer el password', async () => {
      const res = await fetch(`${E2E_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'E2E Customer',
          email: customerEmail,
          password,
        }),
      });
      const body = await parseJson(res);

      expect(res.status).toBe(201);
      expect(body).toMatchObject({
        name: 'E2E Customer',
        email: customerEmail,
        role: 'customer',
      });
      expect(body.password).toBeUndefined();
    });

    it('rechaza el registro si se intenta enviar un role (whitelist)', async () => {
      const res = await fetch(`${E2E_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hacker',
          email: `e2e-hacker-${runId}@test.com`,
          password,
          role: 'admin',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('rechaza el registro con un email duplicado', async () => {
      const first = await fetch(`${E2E_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Original',
          email: duplicateEmail,
          password,
        }),
      });
      expect(first.status).toBe(201);

      const second = await fetch(`${E2E_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicado',
          email: duplicateEmail,
          password,
        }),
      });
      expect(second.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('devuelve un access_token con credenciales correctas', async () => {
      const res = await fetch(`${E2E_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customerEmail, password }),
      });
      const body = await parseJson(res);

      expect(res.status).toBe(200);
      expect(typeof body.access_token).toBe('string');
      customerToken = body.access_token as string;
    });

    it('loguea al admin sembrado para usarlo en los casos de rol', async () => {
      const res = await fetch(`${E2E_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password }),
      });
      const body = await parseJson(res);

      expect(res.status).toBe(200);
      adminToken = body.access_token as string;
    });

    it('rechaza login con password incorrecta (mensaje genérico)', async () => {
      const res = await fetch(`${E2E_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerEmail,
          password: 'wrong-password',
        }),
      });
      const body = await parseJson(res);

      expect(res.status).toBe(401);
      expect(body.message).toBe('Credenciales inválidas');
    });

    it('rechaza login con email inexistente (mismo mensaje genérico, evita enumeración)', async () => {
      const res = await fetch(`${E2E_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `no-existe-${runId}@test.com`,
          password,
        }),
      });
      const body = await parseJson(res);

      expect(res.status).toBe(401);
      expect(body.message).toBe('Credenciales inválidas');
    });
  });

  describe('GET/PATCH /users/me', () => {
    it('rechaza el acceso sin token', async () => {
      const res = await fetch(`${E2E_BASE_URL}/users/me`);
      expect(res.status).toBe(401);
    });

    it('devuelve el propio perfil con un token válido', async () => {
      const res = await fetch(`${E2E_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const body = await parseJson(res);

      expect(res.status).toBe(200);
      expect(body.email).toBe(customerEmail);
    });

    it('permite actualizar el propio perfil con un token válido', async () => {
      const res = await fetch(`${E2E_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ name: 'E2E Customer Actualizado' }),
      });
      const body = await parseJson(res);

      expect(res.status).toBe(200);
      expect(body.name).toBe('E2E Customer Actualizado');
    });
  });

  describe('Rutas admin-only (RolesGuard)', () => {
    it('rechaza a un customer con 403 en una ruta de mutación admin-only', async () => {
      const res = await fetch(`${E2E_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ name: 'E2E Categoría Rechazada' }),
      });
      expect(res.status).toBe(403);
    });

    it('permite a un admin crear un recurso en una ruta protegida', async () => {
      const res = await fetch(`${E2E_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: testCategoryName }),
      });
      const body = await parseJson(res);

      expect(res.status).toBe(201);
      expect(body.name).toBe(testCategoryName);
    });

    it('deja la lectura pública sin necesidad de token', async () => {
      const res = await fetch(`${E2E_BASE_URL}/categories`);
      expect(res.status).toBe(200);
    });
  });
});
