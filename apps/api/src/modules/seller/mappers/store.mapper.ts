import type { Store as DbStore } from '../../../../generated/prisma';

import type { SellerStore } from '@community-marketplace/types';

import { resolveOptionalAssetPublicUrl } from '../../../libs/asset-url.lib';

import {
  normalizeStoreOpeningHours,
  parseStoreContactSettings,
  parseStorePolicies,
} from '../../listings/utils/store-contact.util';

export function mapSellerStore(row: DbStore): SellerStore {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    logoUrl: resolveOptionalAssetPublicUrl(row.logoUrl),
    bannerUrl: resolveOptionalAssetPublicUrl(row.bannerUrl),
    location: row.location ?? undefined,
    contact: parseStoreContactSettings(row.contactSettings),
    openingHours: normalizeStoreOpeningHours(row.openingHours),
    policies: parseStorePolicies(row.policies),
    isPrimary: row.isPrimary,
    isFeatured: row.isFeatured && row.featuredUntil != null && row.featuredUntil > new Date(),
    featuredUntil: row.featuredUntil?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
