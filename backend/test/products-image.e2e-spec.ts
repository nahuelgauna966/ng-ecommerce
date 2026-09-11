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
}

interface ProductResponse {
  id?: number;
  imageUrl?: string;
  cloudinaryPublicId?: string;
  message?: string;
}

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

// Nest (FileTypeValidator) valida el contenido real del archivo (magic
// numbers vía el paquete `file-type`), no solo el mimetype declarado en el
// form-data. Por eso los buffers de prueba necesitan una cabecera real y
// detectable de cada formato para que la validación de tipo pase en los
// tests de éxito, y sea rechazada correctamente en los de tipo inválido.
const MAGIC_BYTES: Record<string, Buffer> = {
  // PNG mínimo válido de 1x1 (con IHDR/IDAT/IEND reales), `file-type`
  // necesita la estructura real, no solo la firma de 8 bytes.
  'image/png': Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  ),
  'image/jpeg': Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]),
  'image/webp': Buffer.concat([
    Buffer.from('RIFF', 'ascii'),
    Buffer.from([0x24, 0x00, 0x00, 0x00]),
    Buffer.from('WEBP', 'ascii'),
    Buffer.from('VP8 ', 'ascii'),
  ]),
};

function buildImageForm(
  fieldName: string,
  sizeInBytes: number,
  mimeType: string,
  filename: string,
): FormData {
  const header = MAGIC_BYTES[mimeType] ?? Buffer.alloc(0);
  const padding = Buffer.alloc(Math.max(sizeInBytes - header.length, 0));
  const content = Buffer.concat([header, padding]);

  const form = new FormData();
  const blob = new Blob([content], { type: mimeType });
  form.append(fieldName, blob, filename);
  return form;
}

/**
 * Test e2e de la subida de imagen de producto (NE-55), corrido contra una
 * instancia real y compilada del backend (ver global-setup.ts).
 *
 * Nota: las credenciales de Cloudinary en .env todavía son placeholders
 * ('changeme'), así que el caso de éxito (subida real a Cloudinary) queda
 * como pending (it.skip) hasta que se carguen credenciales reales. Los
 * casos de guards/validación de archivo no dependen de Cloudinary y sí
 * corren siempre.
 */
describe('Products image upload (e2e)', () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });

  const hasRealCloudinaryCreds =
    !!process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'changeme';
  const maybeIt = hasRealCloudinaryCreds ? it : it.skip;

  const runId = Date.now();
  const adminEmail = `e2e-products-image-admin-${runId}@test.com`;
  const customerEmail = `e2e-products-image-customer-${runId}@test.com`;
  const password = 'secret123';
  const categoryName = `E2E Products Image Categoría ${runId}`;
  const productName = `E2E Products Image Producto ${runId}`;

  let adminToken: string;
  let customerToken: string;
  let productId: number;

  beforeAll(async () => {
    await db.connect();

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO users (name, email, password, role, "isActive")
       VALUES ($1, $2, $3, 'admin', true)`,
      ['E2E Products Image Admin', adminEmail, hashedPassword],
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
        name: 'E2E Products Image Customer',
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
        price: 100,
        categoryId,
        initialStock: 1,
      }),
    });
    productId = (await parseJson<ProductResponse>(productRes)).id as number;
  }, 20000);

  afterAll(async () => {
    await db.query('DELETE FROM products WHERE name = $1', [productName]);
    await db.query('DELETE FROM categories WHERE name = $1', [categoryName]);
    await db.query('DELETE FROM users WHERE email = ANY($1)', [
      [adminEmail, customerEmail],
    ]);
    await db.end();
  });

  describe('POST /products/:id/image', () => {
    it('devuelve 401 sin token', async () => {
      const form = buildImageForm('image', 1024, 'image/png', 'foto.png');
      const res = await fetch(`${E2E_BASE_URL}/products/${productId}/image`, {
        method: 'POST',
        body: form,
      });
      expect(res.status).toBe(401);
    });

    it('devuelve 403 si el usuario no es admin', async () => {
      const form = buildImageForm('image', 1024, 'image/png', 'foto.png');
      const res = await fetch(`${E2E_BASE_URL}/products/${productId}/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: form,
      });
      expect(res.status).toBe(403);
    });

    it('devuelve 404 si el producto no existe', async () => {
      const form = buildImageForm('image', 1024, 'image/png', 'foto.png');
      const res = await fetch(`${E2E_BASE_URL}/products/999999/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: form,
      });
      expect(res.status).toBe(404);
    });

    it('devuelve 400 si el tipo de archivo no es jpeg/png/webp', async () => {
      const form = buildImageForm(
        'image',
        1024,
        'text/plain',
        'archivo.txt',
      );
      const res = await fetch(`${E2E_BASE_URL}/products/${productId}/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: form,
      });
      expect(res.status).toBe(400);
    });

    it('devuelve 400 si el archivo supera los 5MB', async () => {
      const form = buildImageForm(
        'image',
        6 * 1024 * 1024,
        'image/png',
        'foto-grande.png',
      );
      const res = await fetch(`${E2E_BASE_URL}/products/${productId}/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: form,
      });
      expect(res.status).toBe(400);
    });

    maybeIt(
      'sube la imagen a Cloudinary y actualiza el producto',
      async () => {
        const form = buildImageForm(
          'image',
          1024,
          'image/png',
          'foto.png',
        );
        const res = await fetch(
          `${E2E_BASE_URL}/products/${productId}/image`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: form,
          },
        );
        expect(res.status).toBe(201);
        const body = await parseJson<ProductResponse>(res);
        expect(body.imageUrl).toEqual(expect.stringContaining('cloudinary'));
        expect(body.cloudinaryPublicId).toBeTruthy();
      },
      15000,
    );

    maybeIt(
      'reemplaza la imagen anterior al subir una nueva',
      async () => {
        const firstForm = buildImageForm(
          'image',
          1024,
          'image/png',
          'foto1.png',
        );
        const firstRes = await fetch(
          `${E2E_BASE_URL}/products/${productId}/image`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: firstForm,
          },
        );
        const first = await parseJson<ProductResponse>(firstRes);

        const secondForm = buildImageForm(
          'image',
          1024,
          'image/webp',
          'foto2.webp',
        );
        const secondRes = await fetch(
          `${E2E_BASE_URL}/products/${productId}/image`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: secondForm,
          },
        );
        expect(secondRes.status).toBe(201);
        const second = await parseJson<ProductResponse>(secondRes);
        expect(second.cloudinaryPublicId).not.toEqual(
          first.cloudinaryPublicId,
        );
      },
      20000,
    );
  });
});
