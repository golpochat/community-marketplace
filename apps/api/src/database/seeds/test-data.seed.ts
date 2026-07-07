import { createHash } from 'crypto';

import type { Prisma, PrismaClient } from '../../../generated/prisma';

import {
  DUBLIN_LOCATION,
  TEST_ADDITIONAL_USERS,
  TEST_DATA_DELIVERY_OPTION_IDS,
  TEST_DATA_ENTITY_IDS,
  TEST_DATA_LISTING_IDS,
  TEST_DATA_STORE_IDS,
  TEST_DATA_USER_IDS,
  TEST_DATA_USERS,
  TEST_LISTINGS,
  daysAgo,
  daysFromNow,
} from '../test-data.seed.data';
import { hashPassword } from './password-hash';
import { assertRbacSeedAllowed } from './seed-environment';
import { loadRbacSeedConfig } from './seed-config';

export interface TestDataSeedResult {
  additionalUsers: number;
  stores: number;
  listings: number;
  relations: {
    payment: boolean;
    chatThread: boolean;
    dispute: boolean;
    moderationReports: number;
    fraudSignals: number;
    adminInvitation: boolean;
    verifications: number;
    reviewLogs: number;
  };
}

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';

export interface RunTestDataSeedOptions {
  skipEnvironmentCheck?: boolean;
}

export async function runTestDataSeed(
  prisma: PrismaClient,
  options: RunTestDataSeedOptions = {},
): Promise<TestDataSeedResult> {
  const config = loadRbacSeedConfig();
  if (!options.skipEnvironmentCheck) {
    assertRbacSeedAllowed(config);
  }

  console.log('[test-data-seed] Starting (NODE_ENV=%s)', config.NODE_ENV);

  await assertPrerequisites(prisma);

  const additionalUsers = await seedAdditionalUsers(prisma, config.RBAC_SEED_RESET_PASSWORD);
  await seedDemoSellerProfile(prisma);
  const stores = await seedStores(prisma);
  const listings = await seedListings(prisma);
  await seedListingDeliveryOptions(prisma);
  const relations = await seedRelations(prisma);

  console.log('[test-data-seed] Complete:', {
    additionalUsers,
    stores,
    listings,
    relations,
  });

  return { additionalUsers, stores, listings, relations };
}

async function assertPrerequisites(prisma: PrismaClient): Promise<void> {
  const roleCount = await prisma.role.count();
  if (roleCount === 0) {
    throw new Error('Roles missing — run `pnpm seed:rbac` first.');
  }

  const user = await prisma.user.findUnique({
    where: { id: TEST_DATA_USERS.demoSeller },
  });
  if (!user) {
    throw new Error('Dev users missing — run `pnpm seed:dev-users` first.');
  }

  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    throw new Error('Categories missing — run `pnpm seed:dev-users` first.');
  }
}

async function seedAdditionalUsers(
  prisma: PrismaClient,
  resetPassword: boolean,
): Promise<number> {
  const sellerRole = await prisma.role.findFirst({ where: { code: 'SELLER' } });
  if (!sellerRole) {
    throw new Error('SELLER role not found');
  }

  let count = 0;
  for (const entry of TEST_ADDITIONAL_USERS) {
    const existing = await prisma.user.findUnique({ where: { id: entry.id } });
    const passwordHash = hashPassword(entry.password);
    const shouldUpdatePassword = resetPassword || !existing;

    if (existing) {
      await prisma.user.update({
        where: { id: entry.id },
        data: {
          primaryRoleId: sellerRole.id,
          displayName: entry.displayName,
          status: 'active',
          sellerStatus: entry.sellerStatus,
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
          phoneVerifiedAt: existing.phoneVerifiedAt ?? new Date(),
          profileCompleted: true,
          ...(shouldUpdatePassword ? { passwordHash } : {}),
        },
      });
    } else {
      await prisma.user.create({
        data: {
          id: entry.id,
          email: entry.email,
          passwordHash,
          displayName: entry.displayName,
          primaryRoleId: sellerRole.id,
          status: 'active',
          sellerStatus: entry.sellerStatus,
          emailVerifiedAt: new Date(),
          phoneVerifiedAt: new Date(),
          profileCompleted: true,
        },
      });
    }

    await prisma.userProfile.upsert({
      where: { userId: entry.id },
      create: {
        userId: entry.id,
        phone: entry.phone,
        location: DUBLIN_LOCATION.label,
        address: '22 Dame Street, Dublin 2',
        businessName: entry.displayName,
        isBusinessAccount: true,
      },
      update: {
        phone: entry.phone,
        location: DUBLIN_LOCATION.label,
        address: '22 Dame Street, Dublin 2',
        businessName: entry.displayName,
        isBusinessAccount: true,
      },
    });

    count += 1;
  }

  return count;
}

async function seedDemoSellerProfile(prisma: PrismaClient): Promise<void> {
  await prisma.user.update({
    where: { id: TEST_DATA_USERS.demoSeller },
    data: {
      sellerStatus: 'verified',
      approvedListingCount: 12,
      storeSlotLimit: 2,
      verificationCompletedAt: new Date(),
    },
  });
}

async function seedStores(prisma: PrismaClient): Promise<number> {
  const stores = [
    {
      id: TEST_DATA_STORE_IDS.demoPrimary,
      userId: TEST_DATA_USERS.demoSeller,
      name: 'Demo Seller Store',
      slug: 'demo-seller',
      description: 'Primary seeded storefront for integration testing.',
      location: DUBLIN_LOCATION.label,
      isPrimary: true,
    },
    {
      id: TEST_DATA_STORE_IDS.demoSecondary,
      userId: TEST_DATA_USERS.demoSeller,
      name: 'Demo Seller Outlet',
      slug: 'demo-seller-outlet',
      description: 'Secondary storefront for multi-store tests.',
      location: DUBLIN_LOCATION.label,
      isPrimary: false,
    },
    {
      id: TEST_DATA_STORE_IDS.sellerUnverified,
      userId: TEST_DATA_USER_IDS.sellerUnverified,
      name: 'Unverified Seller Shop',
      slug: 'unverified-seller',
      description: 'Storefront for unverified seller gate testing.',
      location: DUBLIN_LOCATION.label,
      isPrimary: true,
    },
    {
      id: TEST_DATA_STORE_IDS.sellerSuspended,
      userId: TEST_DATA_USER_IDS.sellerSuspended,
      name: 'Suspended Seller Shop',
      slug: 'suspended-seller',
      description: 'Storefront for suspended seller cascade tests.',
      location: DUBLIN_LOCATION.label,
      isPrimary: true,
    },
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { id: store.id },
      create: store,
      update: {
        name: store.name,
        slug: store.slug,
        description: store.description,
        location: store.location,
        isPrimary: store.isPrimary,
      },
    });
  }

  return stores.length;
}

async function seedListings(prisma: PrismaClient): Promise<number> {
  const activatedAt = daysAgo(7);
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const categoryBySlug = new Map(categories.map((row: { id: string; slug: string }) => [row.slug, row.id]));

  for (const listing of TEST_LISTINGS) {
    const categoryId = categoryBySlug.get(listing.categorySlug);
    if (!categoryId) {
      throw new Error(`Category not found for slug: ${listing.categorySlug}`);
    }

    const expiresAt = listing.expiredDaysAgo
      ? daysAgo(listing.expiredDaysAgo)
      : daysFromNow(30);
    const boostedUntil = listing.boostedUntilDays ? daysFromNow(listing.boostedUntilDays) : null;

    await prisma.listing.upsert({
      where: { id: listing.id },
      create: {
        id: listing.id,
        sellerId: listing.sellerId,
        storeId: listing.storeId,
        categoryId,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        originalPrice: listing.originalPrice ?? null,
        salePrice: listing.salePrice ?? null,
        discountPercent:
          listing.originalPrice && listing.salePrice
            ? Math.round(((listing.originalPrice - listing.salePrice) / listing.originalPrice) * 100)
            : null,
        currency: 'EUR',
        condition: listing.condition,
        status: listing.status,
        packageType: 'FREE',
        activatedAt: listing.status === 'active' || listing.status === 'sold' ? activatedAt : null,
        expiresAt:
          listing.status === 'expired'
            ? expiresAt
            : listing.status === 'active'
              ? daysFromNow(30)
              : null,
        endedAt: listing.status === 'ended' ? daysAgo(1) : null,
        rejectionReason: listing.rejectionReason ?? null,
        removalReason: listing.removalReason ?? null,
        locationLabel: DUBLIN_LOCATION.label,
        latitude: DUBLIN_LOCATION.latitude,
        longitude: DUBLIN_LOCATION.longitude,
        bannedAt: listing.bannedAt ? daysAgo(1) : null,
        moderationHiddenAt: listing.moderationHiddenAt ? daysAgo(1) : null,
        attributes: (listing.attributes ?? undefined) as Prisma.InputJsonValue | undefined,
        requiresFraudReview: listing.requiresFraudReview ?? false,
        isFeatured: listing.isFeatured ?? false,
        featuredUntil: listing.isFeatured ? daysFromNow(7) : null,
        featuredPlacement: listing.isFeatured ? 'homepage' : null,
        boostedUntil,
      },
      update: {
        title: listing.title,
        description: listing.description,
        price: listing.price,
        status: listing.status,
        categoryId,
        originalPrice: listing.originalPrice ?? null,
        salePrice: listing.salePrice ?? null,
        rejectionReason: listing.rejectionReason ?? null,
        removalReason: listing.removalReason ?? null,
        moderationHiddenAt: listing.moderationHiddenAt ? daysAgo(1) : null,
        requiresFraudReview: listing.requiresFraudReview ?? false,
        isFeatured: listing.isFeatured ?? false,
        boostedUntil,
      },
    });

    const imageCount = await prisma.listingImage.count({ where: { listingId: listing.id } });
    if (imageCount === 0) {
      await prisma.listingImage.create({
        data: {
          listingId: listing.id,
          url: PLACEHOLDER_IMAGE,
          sortOrder: 0,
        },
      });
    }
  }

  return TEST_LISTINGS.length;
}

async function seedListingDeliveryOptions(prisma: PrismaClient): Promise<void> {
  const attachListings = [
    TEST_DATA_LISTING_IDS.activeElectronics,
    TEST_DATA_LISTING_IDS.activeVehicles,
    TEST_DATA_LISTING_IDS.activeDeliveryReview,
    TEST_DATA_LISTING_IDS.activeFeatured,
    TEST_DATA_LISTING_IDS.soldElectronics,
  ];

  for (const listingId of attachListings) {
    const existing = await prisma.listingDeliveryOption.count({ where: { listingId } });
    if (existing > 0) {
      continue;
    }

    await prisma.listingDeliveryOption.createMany({
      data: [
        {
          listingId,
          deliveryOptionId: TEST_DATA_DELIVERY_OPTION_IDS.collection,
        },
        {
          listingId,
          deliveryOptionId: TEST_DATA_DELIVERY_OPTION_IDS.nationwide,
          customPrice: 25,
        },
      ],
    });
  }
}

async function seedRelations(
  prisma: PrismaClient,
): Promise<TestDataSeedResult['relations']> {
  await prisma.payment.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.paymentSold },
    create: {
      id: TEST_DATA_ENTITY_IDS.paymentSold,
      listingId: TEST_DATA_LISTING_IDS.soldElectronics,
      buyerId: TEST_DATA_USERS.demoBuyer,
      sellerId: TEST_DATA_USERS.demoSeller,
      amount: 199,
      platformFee: 15.92,
      feePercentApplied: 8,
      currency: 'EUR',
      method: 'card',
      status: 'succeeded',
      providerPaymentId: 'pi_test_seed_sold_electronics',
      receiptNumber: 'RCPT-TEST-0001',
    },
    update: {
      status: 'succeeded',
      amount: 199,
    },
  });

  await prisma.marketplaceDispute.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.marketplaceDispute },
    create: {
      id: TEST_DATA_ENTITY_IDS.marketplaceDispute,
      buyerId: TEST_DATA_USERS.demoBuyer,
      sellerId: TEST_DATA_USERS.demoSeller,
      listingId: TEST_DATA_LISTING_IDS.soldElectronics,
      paymentId: TEST_DATA_ENTITY_IDS.paymentSold,
      reason: 'item_not_as_described',
      description: 'Seeded open dispute for admin resolution testing.',
      disputeStatus: 'open',
    },
    update: {
      disputeStatus: 'open',
      description: 'Seeded open dispute for admin resolution testing.',
    },
  });

  await prisma.chatThread.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.chatThread },
    create: {
      id: TEST_DATA_ENTITY_IDS.chatThread,
      buyerId: TEST_DATA_USERS.demoBuyer,
      sellerId: TEST_DATA_USERS.demoSeller,
      listingId: TEST_DATA_LISTING_IDS.activeElectronics,
      lastMessageAt: new Date(),
      lastMessagePreview: 'Is this still available?',
    },
    update: {
      lastMessageAt: new Date(),
      lastMessagePreview: 'Is this still available?',
    },
  });

  await prisma.chatMessage.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.chatMessageBuyer },
    create: {
      id: TEST_DATA_ENTITY_IDS.chatMessageBuyer,
      threadId: TEST_DATA_ENTITY_IDS.chatThread,
      senderId: TEST_DATA_USERS.demoBuyer,
      content: 'Hi, is this still available for collection in Dublin?',
      messageType: 'text',
    },
    update: { content: 'Hi, is this still available for collection in Dublin?' },
  });

  await prisma.chatMessage.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.chatMessageSeller },
    create: {
      id: TEST_DATA_ENTITY_IDS.chatMessageSeller,
      threadId: TEST_DATA_ENTITY_IDS.chatThread,
      senderId: TEST_DATA_USERS.demoSeller,
      content: 'Yes, available today. I can meet on Grafton Street.',
      messageType: 'text',
      readBy: [TEST_DATA_USERS.demoBuyer],
    },
    update: { content: 'Yes, available today. I can meet on Grafton Street.' },
  });

  await prisma.chatMessage.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.chatMessageFlagged },
    create: {
      id: TEST_DATA_ENTITY_IDS.chatMessageFlagged,
      threadId: TEST_DATA_ENTITY_IDS.chatThread,
      senderId: TEST_DATA_USERS.demoBuyer,
      content: 'Please wire transfer outside the platform.',
      messageType: 'text',
    },
    update: { content: 'Please wire transfer outside the platform.' },
  });

  const moderationReports = await seedModerationReports(prisma);
  const fraudSignals = await seedFraudSignals(prisma);
  const adminInvitation = await seedAdminInvitation(prisma);
  const verifications = await seedVerifications(prisma);
  const reviewLogs = await seedReviewLogs(prisma);

  await seedWalletData(prisma);

  return {
    payment: true,
    chatThread: true,
    dispute: true,
    moderationReports,
    fraudSignals,
    adminInvitation,
    verifications,
    reviewLogs,
  };
}

async function seedModerationReports(prisma: PrismaClient): Promise<number> {
  await prisma.moderationReport.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.moderationReportListing },
    create: {
      id: TEST_DATA_ENTITY_IDS.moderationReportListing,
      reporterId: TEST_DATA_USERS.demoBuyer,
      listingId: TEST_DATA_LISTING_IDS.flaggedElectronics,
      reason: 'fake_listing',
      description: 'Seeded listing report for moderation queue.',
      status: 'pending',
    },
    update: {
      status: 'pending',
      description: 'Seeded listing report for moderation queue.',
    },
  });

  await prisma.moderationReport.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.moderationReportMessage },
    create: {
      id: TEST_DATA_ENTITY_IDS.moderationReportMessage,
      reporterId: TEST_DATA_USERS.demoSeller,
      messageId: TEST_DATA_ENTITY_IDS.chatMessageFlagged,
      reason: 'scams',
      description: 'Seeded message report for message moderation.',
      status: 'pending',
    },
    update: {
      status: 'pending',
      messageId: TEST_DATA_ENTITY_IDS.chatMessageFlagged,
    },
  });

  await prisma.chatMessageFlag.upsert({
    where: { id: '00000000-0000-4000-9000-000000000404' },
    create: {
      id: '00000000-0000-4000-9000-000000000404',
      messageId: TEST_DATA_ENTITY_IDS.chatMessageFlagged,
      reporterId: TEST_DATA_USERS.demoSeller,
      reason: 'scams',
      status: 'open',
    },
    update: { status: 'open' },
  });

  return 2;
}

async function seedFraudSignals(prisma: PrismaClient): Promise<number> {
  await prisma.fraudSignal.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.fraudSignal },
    create: {
      id: TEST_DATA_ENTITY_IDS.fraudSignal,
      userId: TEST_DATA_USERS.demoSeller,
      listingId: TEST_DATA_LISTING_IDS.flaggedElectronics,
      signalType: 'high_risk_keywords',
      signalValue: 'wire transfer',
      riskScore: 65,
    },
    update: {
      riskScore: 65,
      signalValue: 'wire transfer',
    },
  });

  return 1;
}

async function seedAdminInvitation(prisma: PrismaClient): Promise<boolean> {
  const adminRole = await prisma.role.findFirst({ where: { code: 'ADMIN' } });
  if (!adminRole) {
    return false;
  }

  const tokenHash = createHash('sha256').update('dev-test-invite-token').digest('hex');

  await prisma.adminInvitation.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.adminInvitation },
    create: {
      id: TEST_DATA_ENTITY_IDS.adminInvitation,
      email: 'invite-test@community.market',
      displayName: 'Invited Test Admin',
      roleId: adminRole.id,
      tokenHash,
      invitedById: TEST_DATA_USERS.superAdmin,
      expiresAt: daysFromNow(14),
    },
    update: {
      email: 'invite-test@community.market',
      expiresAt: daysFromNow(14),
      revokedAt: null,
      acceptedAt: null,
    },
  });

  return true;
}

async function seedVerifications(prisma: PrismaClient): Promise<number> {
  await prisma.userVerification.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.buyerVerification },
    create: {
      id: TEST_DATA_ENTITY_IDS.buyerVerification,
      userId: TEST_DATA_USERS.demoBuyer,
      status: 'pending',
      idDocumentFrontUrl: '/uploads/test/id-front.jpg',
      selfieUrl: '/uploads/test/selfie.jpg',
    },
    update: { status: 'pending' },
  });

  await prisma.sellerVerificationRequest.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.sellerVerificationRequest },
    create: {
      id: TEST_DATA_ENTITY_IDS.sellerVerificationRequest,
      userId: TEST_DATA_USER_IDS.sellerUnverified,
      phoneNumber: '+353871000003',
      status: 'pending',
      idDocumentPath: '/uploads/test/seller-id.pdf',
      selfiePath: '/uploads/test/seller-selfie.jpg',
    },
    update: { status: 'pending' },
  });

  return 2;
}

async function seedReviewLogs(prisma: PrismaClient): Promise<number> {
  await prisma.deliveryChangeLog.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.deliveryChangeLog },
    create: {
      id: TEST_DATA_ENTITY_IDS.deliveryChangeLog,
      listingId: TEST_DATA_LISTING_IDS.activeDeliveryReview,
      sellerId: TEST_DATA_USERS.demoSeller,
      changes: {
        before: [{ zone: 'COLLECTION' }],
        after: [{ zone: 'NATIONAL', customPrice: 45 }],
      },
      requiresReview: true,
      status: 'PENDING',
    },
    update: { status: 'PENDING', requiresReview: true },
  });

  await prisma.priceChangeLog.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.priceChangeLog },
    create: {
      id: TEST_DATA_ENTITY_IDS.priceChangeLog,
      listingId: TEST_DATA_LISTING_IDS.activePriceReview,
      sellerId: TEST_DATA_USERS.demoSeller,
      oldOriginalPrice: 800,
      oldSalePrice: 640,
      newOriginalPrice: 800,
      newSalePrice: 400,
      discountPercent: 50,
      requiresReview: true,
      status: 'PENDING',
    },
    update: { status: 'PENDING', requiresReview: true },
  });

  return 2;
}

async function seedWalletData(prisma: PrismaClient): Promise<void> {
  await prisma.buyerWallet.upsert({
    where: { userId: TEST_DATA_USERS.demoBuyer },
    create: {
      userId: TEST_DATA_USERS.demoBuyer,
      balance: 3.98,
    },
    update: { balance: 3.98 },
  });

  await prisma.cashbackGrant.upsert({
    where: { id: TEST_DATA_ENTITY_IDS.cashbackGrant },
    create: {
      id: TEST_DATA_ENTITY_IDS.cashbackGrant,
      userId: TEST_DATA_USERS.demoBuyer,
      paymentId: TEST_DATA_ENTITY_IDS.paymentSold,
      amount: 3.98,
      status: 'earned',
      unlockAt: daysAgo(1),
    },
    update: {
      status: 'earned',
      amount: 3.98,
      unlockAt: daysAgo(1),
    },
  });
}
