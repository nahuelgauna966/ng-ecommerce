import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import * as path from 'path';
import { E2E_PID_FILE, E2E_PORT } from './e2e-server.config';

async function waitUntilReady(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  let lastError: unknown;

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) {
        return;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(
    `El servidor e2e no respondió en ${timeoutMs}ms en ${url}. Último error: ${String(lastError)}`,
  );
}

module.exports = async function globalSetup(): Promise<void> {
  const backendRoot = path.join(__dirname, '..');

  const child = spawn('node', ['dist/main.js'], {
    cwd: backendRoot,
    env: { ...process.env, PORT: String(E2E_PORT) },
    stdio: 'ignore',
  });
  child.unref();

  writeFileSync(E2E_PID_FILE, String(child.pid));

  await waitUntilReady(`http://localhost:${E2E_PORT}/api/v1/categories`, 30000);
};
