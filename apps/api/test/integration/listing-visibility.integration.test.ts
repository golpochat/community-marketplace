import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { ListingVisibilityService } from '../../src/modules/listings/services/listing-visibility.service';
import { TEST_DATA_LISTING_IDS } from '../../src/database/test-data.seed.data';
import {
  disconnectTestPrisma,
  getTestPrisma,
  hasDatabase,
  seedFullTestDatabase,
} from '../helpers/db';

const describeIfDb = hasDatabase ? describe : describe.skip;

describeIfDb('Listing visibility integration', () => {
  beforeAll(async () => {
    await seedFullTestDatabase();
  }, 120_000);

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it('returns only publicly visible active listings for marketplace browse', async () => {
    const prisma = getTestPrisma();
    const visibility = new ListingVisibilityService(prisma as never);

    const visible = await prisma.listing.findMany({
      where: visibility.visibleListingWhere({ title: { startsWith: '[Test]' } }),
      select: { id: true, status: true, title: true },
      orderBy: { title: 'asc' },
    });

    const visibleIds = visible.map((row) => row.id);
    expect(visibleIds).toContain(TEST_DATA_LISTING_IDS.activeElectronics);
    expect(visibleIds).toContain(TEST_DATA_LISTING_IDS.activeFeatured);
    expect(visibleIds).not.toContain(TEST_DATA_LISTING_IDS.draftElectronics);
    expect(visibleIds).not.toContain(TEST_DATA_LISTING_IDS.flaggedElectronics);
    expect(visibleIds).not.toContain(TEST_DATA_LISTING_IDS.underInvestigationVehicles);
    expect(visibleIds).not.toContain(TEST_DATA_LISTING_IDS.suspendedSellerListing);
    expect(visibleIds).not.toContain(TEST_DATA_LISTING_IDS.soldElectronics);
  });

  it('excludes suspended-seller and non-active listings from browse visibility', async () => {
    const prisma = getTestPrisma();
    const visibility = new ListingVisibilityService(prisma as never);

    const suspendedListing = await prisma.listing.findFirstOrThrow({
      where: { id: TEST_DATA_LISTING_IDS.suspendedSellerListing },
      include: { seller: { select: { sellerStatus: true } } },
    });
    expect(suspendedListing.seller.sellerStatus).toBe('suspended');

    const visibleSuspended = await prisma.listing.count({
      where: visibility.visibleListingWhere({ id: TEST_DATA_LISTING_IDS.suspendedSellerListing }),
    });
    expect(visibleSuspended).toBe(0);
  });
});
