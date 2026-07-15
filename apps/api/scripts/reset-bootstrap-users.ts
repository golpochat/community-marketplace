#!/usr/bin/env ts-node
/**
 * Local/dev only: wipe all users (and dependent rows) then reseed bootstrap accounts.
 */

import { ensureApiEnv } from './load-api-env';

ensureApiEnv();

import { PrismaClient } from '../generated/prisma';

import { runRbacSeed } from '../src/database/seeds/rbac.seed';
import { loadRbacSeedConfig } from '../src/database/seeds/seed-config';

async function main(): Promise<void> {
  const config = loadRbacSeedConfig();

  if (config.NODE_ENV === 'production') {
    console.error('[reset-bootstrap-users] Refusing to run in production');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const before = await prisma.user.count();
    console.log(`[reset-bootstrap-users] Wiping ${before} users (+ dependent rows via CASCADE)...`);

    // Truncates users and every table with an FK to users (listings, stores, sessions, etc.).
    // Keeps roles / permissions / categories intact.
    await prisma.$executeRawUnsafe('TRUNCATE TABLE users CASCADE');

    const afterWipe = await prisma.user.count();
    console.log(`[reset-bootstrap-users] Users remaining after wipe: ${afterWipe}`);

    const result = await runRbacSeed(prisma, {
      config: {
        ...config,
        RBAC_SEED_RESET_PASSWORD: true,
      },
    });

    console.log('[reset-bootstrap-users] Bootstrap accounts:');
    for (const user of result.bootstrapUsers) {
      console.log(`  - ${user.email} (${user.role}) created=${user.created} passwordUpdated=${user.passwordUpdated}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('[reset-bootstrap-users] Failed:', error);
  process.exit(1);
});
