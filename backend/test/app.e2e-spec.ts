import { E2E_BASE_URL } from './e2e-server.config';

/**
 * Smoke test básico contra el servidor real levantado en global-setup.ts.
 * (El AppController de ejemplo del boilerplate de Nest ya no existe en
 * este proyecto, por eso se verifica un endpoint público real en su lugar.)
 */
describe('AppModule (e2e)', () => {
  it('GET /categories responde 200 (endpoint público de solo lectura)', async () => {
    const res = await fetch(`${E2E_BASE_URL}/categories`);
    expect(res.status).toBe(200);
  });
});
