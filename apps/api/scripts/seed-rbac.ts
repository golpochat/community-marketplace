#!/usr/bin/env ts-node
/**
 * Standalone RBAC seed runner for development and staging.
 */

import { ensureApiEnv } from './load-api-env';

ensureApiEnv();

import { PrismaClient } from '@prisma/client';

import { runRbacSeed } from '../src/database/seeds/rbac.seed';

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    await runRbacSeed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('[rbac-seed] Failed:', error);
  process.exit(1);
});
