/**
 * Seeds marketplace test fixtures (stores, listings, payments, chat, disputes, etc.).
 * Requires `pnpm seed:rbac` and `pnpm seed:dev-users` first.
 */
import 'dotenv/config';

import { PrismaClient } from '../generated/prisma';

import { runTestDataSeed } from '../src/database/seeds/test-data.seed';

async function main() {
  const prisma = new PrismaClient();
  try {
    await runTestDataSeed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[test-data-seed] Failed:', error);
  process.exit(1);
});
