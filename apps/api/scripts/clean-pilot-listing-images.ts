#!/usr/bin/env ts-node
/**
 * Replace known-bad Unsplash photos on pilot listings (e.g. car photos on vacuum titles).
 *
 *   pnpm --filter @community-marketplace/api run clean:pilot-images
 *   DRY_RUN=1 pnpm --filter @community-marketplace/api run clean:pilot-images
 */

import { config } from 'dotenv';
import { resolve } from 'path';

import { ensureApiEnv } from './load-api-env';

ensureApiEnv();
config({ path: resolve(process.cwd(), '../web/.env') });

import { PrismaClient } from '../generated/prisma';

import { cleanPilotListingImages } from '../src/database/clean-pilot-listing-images';

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

  try {
    const result = await cleanPilotListingImages(prisma, { dryRun });
    console.log('[clean-pilot-listing-images] Complete:', { dryRun, ...result });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('[clean-pilot-listing-images] Failed:', error);
  process.exit(1);
});
