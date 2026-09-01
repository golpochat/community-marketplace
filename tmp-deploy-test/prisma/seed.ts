/**
 * Prisma db seed entrypoint — delegates to runRbacSeed().
 */

import { ensureApiEnv } from '../scripts/load-api-env';

ensureApiEnv();

import { PrismaClient } from '@prisma/client';

import { runRbacSeed } from '../src/database/seeds/rbac.seed';

const prisma = new PrismaClient();

runRbacSeed(prisma)
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('[rbac-seed] Failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
