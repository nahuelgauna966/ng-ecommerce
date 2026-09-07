/**
 * Configuración compartida entre global-setup, global-teardown y los specs
 * e2e: puerto fijo donde se levanta una instancia real y compilada del
 * backend (node dist/main.js) para correr los tests contra un servidor
 * de verdad en lugar de bootear la app dentro del proceso de Jest.
 *
 * Motivo: varias dependencias de este proyecto (@nestjs/passport,
 * @nestjs/mapped-types) se publican como ESM puro y rompen el transform
 * CJS de ts-jest al hacer `require()` de AppModule directamente en un
 * test. Levantar la app como proceso real de Node evita ese problema
 * (Node sí resuelve esas dependencias sin inconvenientes).
 */
export const E2E_PORT = 3050;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}/api/v1`;
export const E2E_PID_FILE = `${__dirname}/.e2e-server.pid`;
