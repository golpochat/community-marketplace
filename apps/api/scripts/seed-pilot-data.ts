/**
 * Seeds pilot marketplace fixtures:
 * - 5 seller accounts (prefers existing live sellers, fills with pilot accounts)
 * - 5 buyer accounts (prefers existing live buyers, fills with pilot accounts)
 * - 50 active listings (10 per seller) with 4 unique sample photos each
 *
 * Local prerequisites:
 *   pnpm seed:rbac
 *   pnpm seed:dev-users
 *   pnpm seed:test-data   (optional — demo seller storefront)
 *
 * Production VPS:
 *   ./infra/scripts/seed-pilot-data-prod-docker.sh
 *   # or: RBAC_SEED_FORCE=true PILOT_USE_EXISTING_USERS=true pnpm seed:pilot-data
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
