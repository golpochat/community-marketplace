import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';

import { config } from 'dotenv';
import { loadApiEnv } from '@community-marketplace/config';

/**
 * Loads apps/api/.env (creates from .env.example if missing) and syncs
 * defaults into process.env so Prisma CLI and PrismaClient work outside Nest.
 */
export function ensureApiEnv(): void {
  const cwd = process.cwd();
  const envPath = resolve(cwd, '.env');
  const examplePath = resolve(cwd, '.env.example');

  if (!existsSync(envPath) && existsSync(examplePath)) {
    copyFileSync(examplePath, envPath);
    console.warn('[env] Created .env from .env.example — review values before production use.');
  }

  config({ path: envPath });

  const apiEnv = loadApiEnv();

  process.env.DATABASE_URL ??= apiEnv.DATABASE_URL;
  process.env.NODE_ENV ??= apiEnv.NODE_ENV;
  process.env.PORT ??= String(apiEnv.PORT);
}
