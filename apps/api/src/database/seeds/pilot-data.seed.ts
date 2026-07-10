import type { PrismaClient } from '../../../generated/prisma';

import {
  PILOT_ADDITIONAL_USERS,
  PILOT_DELIVERY_OPTION_IDS,
  PILOT_LISTINGS,
  PILOT_PASSWORD,
  PILOT_SELLER_IDS,
  PILOT_STORES,
  PILOT_SUMMARY,
  categoryIdForSlug,
  getPilotListingImages,
} from '../pilot-data.seed.data';
import { DEV_BOOTSTRAP_USER_IDS } from '../dev-users.seed.data';
import { hashPassword } from './password-hash';
import { assertRbacSeedAllowed } from './seed-environment';
import { loadRbacSeedConfig } from './seed-config';

export interface PilotDataSeedResult {
  usersUpserted: number;
  storesUpserted: number;
  listingsUpserted: number;
  imagesUpserted: number;
}

export interface RunPilotDataSeedOptions {
  skipEnvironmentCheck?: boolean;
}

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export async function runPilotDataSeed(
  prisma: PrismaClient,
  options: RunPilotDataSeedOptions = {},
): Promise<PilotDataSeedResult> {
  const config = loadRbacSeedConfig();
  if (!options.skipEnvironmentCheck) {
    assertRbacSeedAllowed(config);
  }

  console.log('[pilot-data-seed] Starting (NODE_ENV=%s)', config.NODE_ENV);
  await assertPrerequisites(prisma);

  const usersUpserted = await seedPilotUsers(prisma, config.RBAC_SEED_RESET_PASSWORD);
  await ensureDemoSellerReady(prisma);
  const storesUpserted = await seedPilotStores(prisma);
  const { listingsUpserted, imagesUpserted } = await seedPilotListings(prisma);

  const result = { usersUpserted, storesUpserted, listingsUpserted, imagesUpserted };
  console.log('[pilot-data-seed] Complete:', { ...result, summary: PILOT_SUMMARY });
  return result;
}

async function assertPrerequisites(prisma: PrismaClient): Promise<void> {
  const roleCount = await prisma.role.count();
  if (roleCount === 0) {
    throw new Error('Roles missing — run `pnpm seed:rbac` first.');
  }

  const demoSeller = await prisma.user.findUnique({ where: { id: DEV_BOOTSTRAP_USER_IDS.SELLER } });
  const demoBuyer = await prisma.user.findUnique({ where: { id: DEV_BOOTSTRAP_USER_IDS.BUYER } });
  if (!demoSeller || !demoBuyer) {
    throw new Error('Demo seller/buyer missing — run `pnpm seed:dev-users` first.');
  }

  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    throw new Error('Categories missing — run `pnpm seed:dev-users` first.');
  }

  const demoStore = await prisma.store.findFirst({
    where: { userId: DEV_BOOTSTRAP_USER_IDS.SELLER, isPrimary: true },
  });
  if (!demoStore) {
    throw new Error(
      'Demo seller storefront missing — run `pnpm seed:test-data` first (creates the primary demo store).',
    );
  }
}

async function seedPilotUsers(prisma: PrismaClient, resetPassword: boolean): Promise<number> {
  const roles = await prisma.role.findMany({ select: { id: true, code: true } });
  const roleByCode = new Map(roles.map((role: { id: string; code: string }) => [role.code, role.id]));
  let count = 0;

  for (const entry of PILOT_ADDITIONAL_USERS) {
    const roleId = roleByCode.get(entry.role);
    if (!roleId) {
      throw new Error(`${entry.role} role not found`);
    }

    const existing = await prisma.user.findUnique({ where: { id: entry.id } });
    const passwordHash = hashPassword(PILOT_PASSWORD);
    const shouldUpdatePassword = resetPassword || !existing;

    if (existing) {
      await prisma.user.update({
        where: { id: entry.id },
        data: {
          email: entry.email,
          displayName: entry.displayName,
          primaryRoleId: roleId,
          status: 'active',
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
          phoneVerifiedAt: existing.phoneVerifiedAt ?? new Date(),
          profileCompleted: true,
          ...(entry.role === 'SELLER'
            ? {
                sellerStatus: 'verified',
                approvedListingCount: 10,
                storeSlotLimit: 2,
                verificationCompletedAt: existing.verificationCompletedAt ?? new Date(),
              }
            : {}),
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
          primaryRoleId: roleId,
          status: 'active',
          emailVerifiedAt: new Date(),
          phoneVerifiedAt: new Date(),
          profileCompleted: true,
          ...(entry.role === 'SELLER'
            ? {
                sellerStatus: 'verified',
                approvedListingCount: 10,
                storeSlotLimit: 2,
                verificationCompletedAt: new Date(),
              }
            : {}),
        },
      });
    }

    await prisma.userProfile.upsert({
      where: { userId: entry.id },
      create: {
        userId: entry.id,
        phone: entry.phone,
        location: entry.location.label,
        address: entry.location.label,
        businessName: entry.businessName,
        isBusinessAccount: entry.role === 'SELLER',
        bio:
          entry.role === 'SELLER'
            ? `Pilot seller account for ${entry.location.label}.`
            : `Pilot buyer account based in ${entry.location.label}.`,
      },
      update: {
        phone: entry.phone,
        location: entry.location.label,
        address: entry.location.label,
        businessName: entry.businessName,
        isBusinessAccount: entry.role === 'SELLER',
      },
    });

    count += 1;
  }

  return count;
}

async function ensureDemoSellerReady(prisma: PrismaClient): Promise<void> {
  await prisma.user.update({
    where: { id: PILOT_SELLER_IDS.demo },
    data: {
      sellerStatus: 'verified',
      approvedListingCount: 20,
      storeSlotLimit: 2,
      verificationCompletedAt: new Date(),
    },
  });
}

async function seedPilotStores(prisma: PrismaClient): Promise<number> {
  for (const store of PILOT_STORES) {
    await prisma.store.upsert({
      where: { id: store.id },
      create: {
        id: store.id,
        userId: store.userId,
        name: store.name,
        slug: store.slug,
        description: store.description,
        location: store.location,
        isPrimary: true,
      },
      update: {
        name: store.name,
        slug: store.slug,
        description: store.description,
        location: store.location,
        isPrimary: true,
      },
    });
  }

  return PILOT_STORES.length;
}

async function seedPilotListings(
  prisma: PrismaClient,
): Promise<{ listingsUpserted: number; imagesUpserted: number }> {
  const storeBySeller = new Map<string, string>();
  const demoStore = await prisma.store.findFirst({
    where: { userId: PILOT_SELLER_IDS.demo, isPrimary: true },
    select: { id: true },
  });
  if (!demoStore) {
    throw new Error('Demo seller primary store not found');
  }
  storeBySeller.set(PILOT_SELLER_IDS.demo, demoStore.id);
  for (const store of PILOT_STORES) {
    storeBySeller.set(store.userId, store.id);
  }

  let listingsUpserted = 0;
  let imagesUpserted = 0;
  const activatedAt = daysAgo(3);

  for (const [listingIndex, listing] of PILOT_LISTINGS.entries()) {
    const sellerId = PILOT_SELLER_IDS[listing.sellerKey];
    const storeId = storeBySeller.get(sellerId);
    if (!storeId) {
      throw new Error(`Store not found for seller ${listing.sellerKey}`);
    }

    await prisma.listing.upsert({
      where: { id: listing.id },
      create: {
        id: listing.id,
        sellerId,
        storeId,
        categoryId: categoryIdForSlug(listing.categorySlug),
        title: listing.title,
        description: listing.description,
        price: listing.price,
        currency: 'EUR',
        condition: listing.condition,
        status: 'active',
        packageType: 'FREE',
        activatedAt,
        expiresAt: daysFromNow(30),
        locationLabel: listing.location.label,
        latitude: listing.location.latitude,
        longitude: listing.location.longitude,
      },
      update: {
        sellerId,
        storeId,
        categoryId: categoryIdForSlug(listing.categorySlug),
        title: listing.title,
        description: listing.description,
        price: listing.price,
        condition: listing.condition,
        status: 'active',
        locationLabel: listing.location.label,
        latitude: listing.location.latitude,
        longitude: listing.location.longitude,
        expiresAt: daysFromNow(30),
      },
    });
    listingsUpserted += 1;

    const images = getPilotListingImages(listing, listingIndex);
    for (const image of images) {
      await prisma.listingImage.upsert({
        where: { id: image.id },
        create: {
          id: image.id,
          listingId: listing.id,
          url: image.url,
          sortOrder: image.sortOrder,
        },
        update: {
          url: image.url,
          sortOrder: image.sortOrder,
        },
      });
      imagesUpserted += 1;
    }

    const deliveryCount = await prisma.listingDeliveryOption.count({
      where: { listingId: listing.id },
    });
    if (deliveryCount === 0) {
      await prisma.listingDeliveryOption.create({
        data: {
          listingId: listing.id,
          deliveryOptionId: PILOT_DELIVERY_OPTION_IDS.collection,
        },
      });
      if (listing.includeNationwideDelivery) {
        await prisma.listingDeliveryOption.create({
          data: {
            listingId: listing.id,
            deliveryOptionId: PILOT_DELIVERY_OPTION_IDS.nationwide,
            customPrice: 25,
          },
        });
      }
    }
  }

  return { listingsUpserted, imagesUpserted };
}
