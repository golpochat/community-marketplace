/**
 * Seeds one development user per role (SUPER_ADMIN, ADMIN, SELLER, BUYER).
 * Requires RBAC roles to exist — run `pnpm seed:rbac` first.
 */
import 'dotenv/config';

import { PrismaClient } from '../generated/prisma';

import { runDevUsersSeed } from '../src/database/seeds/dev-users.seed';
import { runDevCategoriesSeed } from '../src/database/seeds/dev-categories.seed';

async function main() {
  const prisma = new PrismaClient();
  try {
    await runDevUsersSeed(prisma);
    await runDevCategoriesSeed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[dev-users-seed] Failed:', error);
  process.exit(1);
});
