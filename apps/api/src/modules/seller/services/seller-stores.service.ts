import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, SellerStatus } from '@prisma/client';

import type { SellerStore, SellerStoreLimits, SellerStoresOverview } from '@community-marketplace/types';
import { STORE_PLATFORM_MAX } from '@community-marketplace/types';
import { DEFAULT_STORE_OPENING_HOURS, DEFAULT_STORE_POLICIES } from '@community-marketplace/utils';
import {
  createStoreSchema,
  updateStoreSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import {
  buildStoreSlugFromName,
  slugifyStoreName,
} from '../../listings/utils/store-slug.util';
import { mapSellerStore } from '../mappers/store.mapper';

@Injectable()
export class SellerStoresService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string): Promise<SellerStoresOverview> {
    const [stores, limits] = await Promise.all([
      this.listForUser(userId),
      this.getLimits(userId),
    ]);
    return { stores, limits };
  }

  async listForUser(userId: string): Promise<SellerStore[]> {
    const rows = await this.prisma.store.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map(mapSellerStore);
  }

  async getForUser(userId: string, storeId: string): Promise<SellerStore> {
    const row = await this.findOwnedStoreOrThrow(userId, storeId);
    return mapSellerStore(row);
  }

  async getPrimaryForUser(userId: string): Promise<SellerStore | null> {
    const row = await this.prisma.store.findFirst({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
    return row ? mapSellerStore(row) : null;
  }

  async create(userId: string, input: unknown): Promise<SellerStore> {
    const parsed = createStoreSchema.parse(input);
    await this.assertCanCreateStore(userId);

    const storeId = crypto.randomUUID();
    const slug = await this.resolveUniqueSlug(
      parsed.preferredSlug ? slugifyStoreName(parsed.preferredSlug) : buildStoreSlugFromName(parsed.name, storeId),
      storeId,
    );

    const existingCount = await this.prisma.store.count({ where: { userId } });

    const row = await this.prisma.store.create({
      data: {
        id: storeId,
        userId,
        name: parsed.name.trim(),
        slug,
        description: parsed.description?.trim() || null,
        location: parsed.location?.trim() || null,
        contactSettings: this.jsonField(parsed.contact),
        openingHours: this.jsonField(parsed.openingHours ?? DEFAULT_STORE_OPENING_HOURS),
        policies: this.jsonField(parsed.policies ?? DEFAULT_STORE_POLICIES),
        isPrimary: existingCount === 0,
      },
    });

    return mapSellerStore(row);
  }

  async update(userId: string, storeId: string, input: unknown): Promise<SellerStore> {
    const parsed = updateStoreSchema.parse(input);
    const existing = await this.findOwnedStoreOrThrow(userId, storeId);

    let slug = existing.slug;
    if (parsed.preferredSlug) {
      slug = await this.resolveUniqueSlug(slugifyStoreName(parsed.preferredSlug), storeId);
    } else if (parsed.name && parsed.name.trim() !== existing.name) {
      slug = await this.resolveUniqueSlug(buildStoreSlugFromName(parsed.name, storeId), storeId);
    }

    const row = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name.trim() } : {}),
        ...(parsed.description !== undefined
          ? { description: parsed.description.trim() || null }
          : {}),
        ...(parsed.location !== undefined ? { location: parsed.location.trim() || null } : {}),
        ...(parsed.logoUrl !== undefined ? { logoUrl: parsed.logoUrl } : {}),
        ...(parsed.bannerUrl !== undefined ? { bannerUrl: parsed.bannerUrl } : {}),
        ...(parsed.contact !== undefined
          ? { contactSettings: this.jsonField(parsed.contact) }
          : {}),
        ...(parsed.openingHours !== undefined
          ? { openingHours: this.jsonField(parsed.openingHours) }
          : {}),
        ...(parsed.policies !== undefined ? { policies: this.jsonField(parsed.policies) } : {}),
        slug,
      },
    });

    return mapSellerStore(row);
  }

  async getLimits(userId: string): Promise<SellerStoreLimits> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { sellerStatus: true, storeSlotLimit: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const storeCount = await this.prisma.store.count({ where: { userId } });
    return this.buildLimits(user.sellerStatus, user.storeSlotLimit, storeCount);
  }

  private async assertCanCreateStore(userId: string): Promise<void> {
    const limits = await this.getLimits(userId);
    if (!limits.canCreateStore) {
      throw new ForbiddenException(limits.blockReason ?? 'You cannot create another storefront.');
    }
  }

  private buildLimits(
    sellerStatus: SellerStatus,
    storeSlotLimit: number,
    storeCount: number,
  ): SellerStoreLimits {
    const requiresVerification = storeCount >= 1 && sellerStatus !== 'verified';
    const atSlotLimit = storeCount >= storeSlotLimit;
    const atPlatformMax = storeCount >= STORE_PLATFORM_MAX;

    let canCreateStore = !atPlatformMax && !atSlotLimit && !requiresVerification;
    let blockReason: string | undefined;

    if (atPlatformMax) {
      canCreateStore = false;
      blockReason = `You can own up to ${STORE_PLATFORM_MAX} storefronts on this platform.`;
    } else if (requiresVerification) {
      canCreateStore = false;
      blockReason = 'Verify your seller account before adding another storefront.';
    } else if (atSlotLimit) {
      canCreateStore = false;
      blockReason = 'Store slot limit reached. Purchase an additional storefront slot to continue.';
    }

    return {
      storeCount,
      storeSlotLimit,
      platformMaxStores: STORE_PLATFORM_MAX,
      canCreateStore,
      requiresVerification,
      blockReason,
    };
  }

  private async findOwnedStoreOrThrow(userId: string, storeId: string) {
    const row = await this.prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!row) throw new NotFoundException('Store not found');
    return row;
  }

  private jsonField(value: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined || value === null) return undefined;
    return value as Prisma.InputJsonValue;
  }

  private async resolveUniqueSlug(baseSlug: string, storeId: string): Promise<string> {
    const normalized = slugifyStoreName(baseSlug);
    let candidate = normalized;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const existing = await this.prisma.store.findUnique({ where: { slug: candidate } });
      if (!existing || existing.id === storeId) return candidate;
      candidate = buildStoreSlugFromName(normalized, `${storeId.slice(0, 8)}${attempt}`);
    }
    throw new BadRequestException('Could not generate a unique store URL. Try a different name.');
  }
}
