/**
 * Seeds pilot marketplace fixtures:
 * - 5 seller accounts (includes existing demo seller)
 * - 5 buyer accounts (includes existing demo buyer)
 * - 50 active listings (10 per seller) with 4 sample photos each
 *
 * Prerequisites:
 *   pnpm seed:rbac
 *   pnpm seed:dev-users
 *   pnpm seed:test-data   (creates demo seller storefront)
 *
 * Production VPS:
 *   RBAC_SEED_FORCE=true pnpm seed:pilot-data
 */
import 'dotenv/config';

import { PrismaClient } from '../generated/prisma';

import { runPilotDataSeed } from '../src/database/seeds/pilot-data.seed';

async function main() {
  const prisma = new PrismaClient();
  try {
    await runPilotDataSeed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[pilot-data-seed] Failed:', error);
  process.exit(1);
});
