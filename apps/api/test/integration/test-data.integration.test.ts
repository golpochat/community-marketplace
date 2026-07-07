import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { TEST_DATA_LISTING_IDS } from '../../src/database/test-data.seed.data';
import {
  disconnectTestPrisma,
  getTestPrisma,
  hasDatabase,
  seedFullTestDatabase,
} from '../helpers/db';

const describeIfDb = hasDatabase ? describe : describe.skip;

const ALL_LISTING_STATUSES = [
  'draft',
  'pending_review',
  'active',
  'paused',
  'expired',
  'sold',
  'ended',
  'removed',
  'rejected',
  'flagged',
  'under_investigation',
  'suspended_seller',
] as const;

describeIfDb('Test data seed integration', () => {
  beforeAll(async () => {
    await seedFullTestDatabase();
  }, 120_000);

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it('creates additional sellers and storefronts', async () => {
    const prisma = getTestPrisma();

    const storeCount = await prisma.store.count({
      where: { slug: { in: ['demo-seller', 'demo-seller-outlet', 'unverified-seller', 'suspended-seller'] } },
    });
    expect(storeCount).toBe(4);

    const unverifiedSeller = await prisma.user.findFirst({
      where: { email: 'seller-unverified@community.market' },
    });
    expect(unverifiedSeller?.sellerStatus).toBe('unverified');

    const suspendedSeller = await prisma.user.findFirst({
      where: { email: 'seller-suspended@community.market' },
    });
    expect(suspendedSeller?.sellerStatus).toBe('suspended');
  });

  it('covers every listing status in seeded fixtures', async () => {
    const prisma = getTestPrisma();
    const listings = await prisma.listing.findMany({
      where: { title: { startsWith: '[Test]' } },
      select: { status: true },
    });

    const statuses = new Set(listings.map((row) => row.status));
    for (const status of ALL_LISTING_STATUSES) {
      expect(statuses.has(status)).toBe(true);
    }
    expect(listings.length).toBeGreaterThanOrEqual(ALL_LISTING_STATUSES.length);
  });

  it('seeds payment, dispute, chat, and moderation fixtures', async () => {
    const prisma = getTestPrisma();

    const payment = await prisma.payment.findUnique({
      where: { id: '00000000-0000-4000-9000-000000000100' },
    });
    expect(payment?.status).toBe('succeeded');
    expect(payment?.listingId).toBe(TEST_DATA_LISTING_IDS.soldElectronics);

    const dispute = await prisma.marketplaceDispute.findFirst({
      where: { listingId: TEST_DATA_LISTING_IDS.soldElectronics },
    });
    expect(dispute?.disputeStatus).toBe('open');

    const thread = await prisma.chatThread.findFirst({
      where: { listingId: TEST_DATA_LISTING_IDS.activeElectronics },
      include: { messages: true },
    });
    expect(thread?.messages.length).toBeGreaterThanOrEqual(3);

    const reports = await prisma.moderationReport.count({
      where: { description: { contains: 'Seeded' } },
    });
    expect(reports).toBeGreaterThanOrEqual(2);
  });

  it('seeds review queues and verification requests', async () => {
    const prisma = getTestPrisma();

    const deliveryPending = await prisma.deliveryChangeLog.count({ where: { status: 'PENDING' } });
    const pricePending = await prisma.priceChangeLog.count({ where: { status: 'PENDING' } });
    expect(deliveryPending).toBeGreaterThanOrEqual(1);
    expect(pricePending).toBeGreaterThanOrEqual(1);

    const buyerVerification = await prisma.userVerification.count({ where: { status: 'pending' } });
    const sellerVerification = await prisma.sellerVerificationRequest.count({
      where: { status: 'pending' },
    });
    expect(buyerVerification).toBeGreaterThanOrEqual(1);
    expect(sellerVerification).toBeGreaterThanOrEqual(1);
  });

  it('seeds admin invitation and fraud signal', async () => {
    const prisma = getTestPrisma();

    const invitation = await prisma.adminInvitation.findFirst({
      where: { email: 'invite-test@community.market' },
    });
    expect(invitation?.acceptedAt).toBeNull();

    const fraud = await prisma.fraudSignal.findFirst({
      where: { listingId: TEST_DATA_LISTING_IDS.flaggedElectronics },
    });
    expect(fraud?.riskScore).toBeGreaterThanOrEqual(50);
  });
});
