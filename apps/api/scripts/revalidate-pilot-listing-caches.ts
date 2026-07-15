#!/usr/bin/env ts-node
/**
 * Revalidate Next.js listing cache for legacy pilot seed IDs.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

import { ensureApiEnv } from './load-api-env';

ensureApiEnv();
config({ path: resolve(process.cwd(), '../web/.env') });

import { PrismaClient } from '../generated/prisma';

import { revalidateListingCache } from '../src/database/clean-pilot-listing-titles';

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    const listings = await prisma.listing.findMany({
      where: { id: { startsWith: '00000000-0000-4000-a000-' } },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    let revalidated = 0;
    for (const listing of listings) {
      if (await revalidateListingCache(listing.id)) revalidated += 1;
    }

    console.log('[revalidate-pilot-listing-caches] Complete:', {
      scanned: listings.length,
      revalidated,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('[revalidate-pilot-listing-caches] Failed:', error);
  process.exit(1);
});
