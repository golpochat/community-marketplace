import type { PrismaClient } from '../../../generated/prisma';

import {
  PILOT_DELIVERY_OPTION_IDS,
  PILOT_LISTINGS,
  PILOT_PASSWORD,
  PILOT_STORES,
  PILOT_SUMMARY,
  PILOT_TARGET_BUYERS,
  PILOT_TARGET_SELLERS,
  SELLER_LOCATIONS,
  categoryIdFromMap,
  getPilotListingImages,
  pilotFillerBuyers,
  pilotFillerSellers,
  type PilotLocation,
  type PilotUserSeed,
} from '../pilot-data.seed.data';
import { runDevCategoriesSeed } from './dev-categories.seed';
import { hashPassword } from './password-hash';
import { assertRbacSeedAllowed } from './seed-environment';
import { loadRbacSeedConfig } from './seed-config';

export interface PilotDataSeedResult {
  usersUpserted: number;
  storesUpserted: number;
  listingsUpserted: number;
  imagesUpserted: number;
  sellers: Array<{ id: string; email: string; source: 'existing' | 'filler' }>;
  buyers: Array<{ id: string; email: string; source: 'existing' | 'filler' }>;
}

export interface RunPilotDataSeedOptions {
  skipEnvironmentCheck?: boolean;
}

interface ResolvedSeller {
  id: string;
  email: string;
  displayName: string;
  location: PilotLocation;
  source: 'existing' | 'filler';
}

interface ResolvedBuyer {
  id: string;
  email: string;
  source: 'existing' | 'filler';
}

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export async function runPilotDataSeed(
  prisma: PrismaClient,
  options: RunPilotDataSeedOptions = {},
): Promise<PilotDataSeedResult> {
  const config = loadRbacSeedConfig();
  if (!options.skipEnvironmentCheck) {
    assertRbacSeedAllowed(config);
  }

  console.log(
    '[pilot-data-seed] Starting (NODE_ENV=%s, PILOT_USE_EXISTING_USERS=%s)',
    config.NODE_ENV,
    config.PILOT_USE_EXISTING_USERS,
  );

  await assertPrerequisites(prisma, config.PILOT_USE_EXISTING_USERS);

  const sellers = await resolveSellerRoster(prisma, config.PILOT_USE_EXISTING_USERS);
  const buyers = await resolveBuyerRoster(prisma, config.PILOT_USE_EXISTING_USERS);

  const usersUpserted = await seedFillerUsers(
    prisma,
    config.RBAC_SEED_RESET_PASSWORD,
    sellers,
    buyers,
    config.PILOT_USE_EXISTING_USERS,
  );

  await prepareSellers(prisma, sellers);
  const storesUpserted = await seedPilotStores(prisma, sellers);
  const categoryBySlug = await loadCategoryMap(prisma);
  const { listingsUpserted, imagesUpserted } = await seedPilotListings(
    prisma,
    sellers,
    categoryBySlug,
  );

  const result: PilotDataSeedResult = {
    usersUpserted,
    storesUpserted,
    listingsUpserted,
    imagesUpserted,
    sellers: sellers.map((seller) => ({
      id: seller.id,
      email: seller.email,
      source: seller.source,
    })),
    buyers: buyers.map((buyer) => ({
      id: buyer.id,
      email: buyer.email,
      source: buyer.source,
    })),
  };

  console.log('[pilot-data-seed] Complete:', { ...result, summary: PILOT_SUMMARY });
  return result;
}

async function assertPrerequisites(
  prisma: PrismaClient,
  useExistingUsers: boolean,
): Promise<void> {
  const roleCount = await prisma.role.count();
  if (roleCount === 0) {
    throw new Error('Roles missing — run `pnpm seed:rbac` first.');
  }

  let categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    console.log('[pilot-data-seed] No categories found — seeding defaults');
    await runDevCategoriesSeed(prisma);
    categoryCount = await prisma.category.count();
  }
  if (categoryCount === 0) {
    throw new Error('Categories missing — run `pnpm seed:dev-users` first.');
  }

  if (!useExistingUsers) {
    const sellerCount = await prisma.user.count({
      where: { primaryRole: { code: 'SELLER' }, status: 'active' },
    });
    const buyerCount = await prisma.user.count({
      where: { primaryRole: { code: 'BUYER' }, status: 'active' },
    });
    if (sellerCount === 0 || buyerCount === 0) {
      throw new Error('No marketplace users found — run `pnpm seed:dev-users` first.');
    }
  }
}

async function loadCategoryMap(prisma: PrismaClient): Promise<Map<string, string>> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true },
  });
  return new Map(rows.map((row) => [row.slug, row.id]));
}

async function resolveSellerRoster(
  prisma: PrismaClient,
  useExistingUsers: boolean,
): Promise<ResolvedSeller[]> {
  const roster: ResolvedSeller[] = [];

  if (useExistingUsers) {
    const existing = await prisma.user.findMany({
      where: {
        status: 'active',
        primaryRole: { code: 'SELLER' },
        sellerStatus: { not: 'suspended' },
      },
      orderBy: { createdAt: 'asc' },
      take: PILOT_TARGET_SELLERS * 2,
      include: { profile: true },
    });

    existing.sort((a, b) => {
      if (a.sellerStatus === 'verified' && b.sellerStatus !== 'verified') return -1;
      if (b.sellerStatus === 'verified' && a.sellerStatus !== 'verified') return 1;
      return 0;
    });

    for (const [index, user] of existing.slice(0, PILOT_TARGET_SELLERS).entries()) {
      roster.push({
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? user.profile?.businessName ?? `Seller ${index + 1}`,
        location: locationFromProfile(user.profile?.location, SELLER_LOCATIONS[index % SELLER_LOCATIONS.length]!),
        source: 'existing',
      });
    }
  }

  const fillers = pilotFillerSellers();
  for (const filler of fillers) {
    if (roster.length >= PILOT_TARGET_SELLERS) break;
    if (roster.some((seller) => seller.id === filler.id || seller.email === filler.email)) {
      continue;
    }
    roster.push({
      id: filler.id,
      email: filler.email,
      displayName: filler.displayName,
      location: filler.location,
      source: 'filler',
    });
  }

  if (roster.length < PILOT_TARGET_SELLERS) {
    throw new Error(
      `Need ${PILOT_TARGET_SELLERS} sellers but only resolved ${roster.length}. Register more sellers or set PILOT_USE_EXISTING_USERS=false after seeding dev users.`,
    );
  }

  return roster.slice(0, PILOT_TARGET_SELLERS);
}

async function resolveBuyerRoster(
  prisma: PrismaClient,
  useExistingUsers: boolean,
): Promise<ResolvedBuyer[]> {
  const roster: ResolvedBuyer[] = [];

  if (useExistingUsers) {
    const existing = await prisma.user.findMany({
      where: {
        status: 'active',
        primaryRole: { code: 'BUYER' },
      },
      orderBy: { createdAt: 'asc' },
      take: PILOT_TARGET_BUYERS,
      select: { id: true, email: true },
    });

    for (const user of existing) {
      roster.push({ id: user.id, email: user.email, source: 'existing' });
    }
  }

  const fillers = pilotFillerBuyers();
  for (const filler of fillers) {
    if (roster.length >= PILOT_TARGET_BUYERS) break;
    if (roster.some((buyer) => buyer.id === filler.id || buyer.email === filler.email)) {
      continue;
    }
    roster.push({ id: filler.id, email: filler.email, source: 'filler' });
  }

  if (roster.length < PILOT_TARGET_BUYERS) {
    throw new Error(
      `Need ${PILOT_TARGET_BUYERS} buyers but only resolved ${roster.length}. Register more buyers or rerun after creating filler accounts.`,
    );
  }

  return roster.slice(0, PILOT_TARGET_BUYERS);
}

function locationFromProfile(
  profileLocation: string | null | undefined,
  fallback: PilotLocation,
): PilotLocation {
  if (!profileLocation?.trim()) {
    return fallback;
  }
  return {
    label: profileLocation,
    latitude: fallback.latitude,
    longitude: fallback.longitude,
  };
}

async function seedFillerUsers(
  prisma: PrismaClient,
  resetPassword: boolean,
  sellers: ResolvedSeller[],
  buyers: ResolvedBuyer[],
  useExistingUsers: boolean,
): Promise<number> {
  if (!useExistingUsers) {
    return seedAllFillerUsers(prisma, resetPassword);
  }

  const fillerIds = new Set(
    [...sellers, ...buyers]
      .filter((account) => account.source === 'filler')
      .map((account) => account.id),
  );

  const fillers = [...pilotFillerSellers(), ...pilotFillerBuyers()].filter((entry) =>
    fillerIds.has(entry.id),
  );

  return upsertPilotUsers(prisma, fillers, resetPassword);
}

async function seedAllFillerUsers(prisma: PrismaClient, resetPassword: boolean): Promise<number> {
  return upsertPilotUsers(
    prisma,
    [...pilotFillerSellers(), ...pilotFillerBuyers()],
    resetPassword,
  );
}

async function upsertPilotUsers(
  prisma: PrismaClient,
  entries: PilotUserSeed[],
  resetPassword: boolean,
): Promise<number> {
  const roles = await prisma.role.findMany({ select: { id: true, code: true } });
  const roleByCode = new Map(roles.map((role: { id: string; code: string }) => [role.code, role.id]));
  let count = 0;

  for (const entry of entries) {
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

async function prepareSellers(prisma: PrismaClient, sellers: ResolvedSeller[]): Promise<void> {
  for (const seller of sellers) {
    await prisma.user.update({
      where: { id: seller.id },
      data: {
        sellerStatus: 'verified',
        approvedListingCount: 20,
        storeSlotLimit: 2,
        verificationCompletedAt: new Date(),
      },
    });
  }
}

async function seedPilotStores(
  prisma: PrismaClient,
  sellers: ResolvedSeller[],
): Promise<number> {
  let count = 0;

  for (const [index, seller] of sellers.entries()) {
    const predefined = PILOT_STORES.find((store) => store.userId === seller.id);
    if (predefined) {
      await prisma.store.upsert({
        where: { id: predefined.id },
        create: {
          id: predefined.id,
          userId: predefined.userId,
          name: predefined.name,
          slug: predefined.slug,
          description: predefined.description,
          location: predefined.location,
          isPrimary: true,
        },
        update: {
          name: predefined.name,
          slug: predefined.slug,
          description: predefined.description,
          location: predefined.location,
          isPrimary: true,
        },
      });
      count += 1;
      continue;
    }

    const existing = await prisma.store.findFirst({
      where: { userId: seller.id, isPrimary: true },
      select: { id: true },
    });
    if (existing) {
      count += 1;
      continue;
    }

    const slugBase = slugify(seller.displayName || seller.email.split('@')[0] || `seller-${index + 1}`);
    const slug = `${slugBase}-${seller.id.slice(0, 8)}`;
    await prisma.store.create({
      data: {
        userId: seller.id,
        name: seller.displayName,
        slug,
        description: `Pilot storefront for ${seller.displayName}.`,
        location: seller.location.label,
        isPrimary: true,
      },
    });
    count += 1;
  }

  return count;
}

async function resolveStoreId(prisma: PrismaClient, sellerId: string): Promise<string> {
  const predefined = PILOT_STORES.find((store) => store.userId === sellerId);
  if (predefined) {
    const store = await prisma.store.findUnique({ where: { id: predefined.id }, select: { id: true } });
    if (store) return store.id;
  }

  const store = await prisma.store.findFirst({
    where: { userId: sellerId, isPrimary: true },
    select: { id: true },
  });
  if (!store) {
    throw new Error(`Primary store not found for seller ${sellerId}`);
  }
  return store.id;
}

async function seedPilotListings(
  prisma: PrismaClient,
  sellers: ResolvedSeller[],
  categoryBySlug: Map<string, string>,
): Promise<{ listingsUpserted: number; imagesUpserted: number }> {
  const storeBySeller = new Map<string, string>();
  for (const seller of sellers) {
    storeBySeller.set(seller.id, await resolveStoreId(prisma, seller.id));
  }

  let listingsUpserted = 0;
  let imagesUpserted = 0;
  const activatedAt = daysAgo(3);

  for (const [listingIndex, listing] of PILOT_LISTINGS.entries()) {
    const seller = sellers[listing.sellerSlot];
    if (!seller) {
      throw new Error(`Seller slot ${listing.sellerSlot} is missing from roster`);
    }

    const sellerId = seller.id;
    const storeId = storeBySeller.get(sellerId);
    if (!storeId) {
      throw new Error(`Store not found for seller ${seller.email}`);
    }

    await prisma.listing.upsert({
      where: { id: listing.id },
      create: {
        id: listing.id,
        sellerId,
        storeId,
        categoryId: categoryIdFromMap(listing.categorySlug, categoryBySlug),
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
        categoryId: categoryIdFromMap(listing.categorySlug, categoryBySlug),
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
