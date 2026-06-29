import type { Store as DbStore } from '../../../../generated/prisma';

import type { SellerStore } from '@community-marketplace/types';

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
    logoUrl: row.logoUrl ?? undefined,
    bannerUrl: row.bannerUrl ?? undefined,
    location: row.location ?? undefined,
    contact: parseStoreContactSettings(row.contactSettings),
    openingHours: normalizeStoreOpeningHours(row.openingHours),
    policies: parseStorePolicies(row.policies),
    isPrimary: row.isPrimary,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
