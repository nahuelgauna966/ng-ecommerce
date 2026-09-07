import { existsSync, readFileSync, unlinkSync } from 'fs';
import { E2E_PID_FILE } from './e2e-server.config';

module.exports = function globalTeardown(): void {
  if (!existsSync(E2E_PID_FILE)) {
    return;
  }

  const pid = Number(readFileSync(E2E_PID_FILE, 'utf-8'));
  try {
    process.kill(pid);
  } catch {
    // El proceso ya no existía, no hay nada que hacer.
  }
  unlinkSync(E2E_PID_FILE);
};
