import { PrismaClient } from '../../generated/prisma';

import { runRbacSeed } from '../../src/database/seeds/rbac.seed';

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

/** Seeds RBAC catalog + bootstrap operator/marketplace accounts. */
export async function seedBootstrapDatabase(): Promise<void> {
  const prisma = getTestPrisma();
  await runRbacSeed(prisma, { skipEnvironmentCheck: true });
}

/** @deprecated Use seedBootstrapDatabase */
export const seedFullTestDatabase = seedBootstrapDatabase;
