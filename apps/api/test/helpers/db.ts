import { PrismaClient } from '../../generated/prisma';

import { runDevCategoriesSeed } from '../../src/database/seeds/dev-categories.seed';
import { runDevUsersSeed } from '../../src/database/seeds/dev-users.seed';
import { runRbacSeed } from '../../src/database/seeds/rbac.seed';
import { runTestDataSeed } from '../../src/database/seeds/test-data.seed';

export const hasDatabase = Boolean(process.env.DATABASE_URL);

let prismaSingleton: PrismaClient | null = null;

export function getTestPrisma(): PrismaClient {
  if (!prismaSingleton) {
    prismaSingleton = new PrismaClient();
  }
  return prismaSingleton;
}

export async function disconnectTestPrisma(): Promise<void> {
  if (prismaSingleton) {
    await prismaSingleton.$disconnect();
    prismaSingleton = null;
  }
}

export async function seedFullTestDatabase(): Promise<void> {
  const prisma = getTestPrisma();
  await runRbacSeed(prisma, { skipEnvironmentCheck: true });
  await runDevUsersSeed(prisma);
  await runDevCategoriesSeed(prisma);
  await runTestDataSeed(prisma, { skipEnvironmentCheck: true });
}
