#!/usr/bin/env ts-node
/**
 * One-off cleanup for legacy pilot seed listing titles.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

import { ensureApiEnv } from './load-api-env';

ensureApiEnv();

// Web app holds REVALIDATE_SECRET for Next.js cache tags.
config({ path: resolve(process.cwd(), '../web/.env') });

import { PrismaClient } from '../generated/prisma';

import { cleanPilotListingTitles } from '../src/database/clean-pilot-listing-titles';

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    const result = await cleanPilotListingTitles(prisma);
    console.log('[clean-pilot-listing-titles] Complete:', result);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('[clean-pilot-listing-titles] Failed:', error);
  process.exit(1);
});
