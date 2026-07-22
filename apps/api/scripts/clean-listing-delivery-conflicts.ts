#!/usr/bin/env ts-node
/**
 * Remove COLLECTION delivery rows from listings that also have shipping
 * (invalid combo that shows contradictory fulfilment on the detail page).
 *
 * Usage:
 *   pnpm --filter @community-marketplace/api exec ts-node -P tsconfig.scripts.json scripts/clean-listing-delivery-conflicts.ts
 *   DRY_RUN=1 …  # report only
 */

import { config } from 'dotenv';
import { resolve } from 'path';

import { ensureApiEnv } from './load-api-env';

ensureApiEnv();
config({ path: resolve(process.cwd(), '../web/.env') });

import { PrismaClient } from '../generated/prisma';

import { cleanListingDeliveryConflicts } from '../src/database/clean-listing-delivery-conflicts';

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

  try {
    const result = await cleanListingDeliveryConflicts(prisma, { dryRun });
    console.log('[clean-listing-delivery-conflicts] Complete:', {
      dryRun,
      ...result,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('[clean-listing-delivery-conflicts] Failed:', error);
  process.exit(1);
});
