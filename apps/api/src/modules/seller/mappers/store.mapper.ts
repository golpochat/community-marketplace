import type { Store as DbStore } from '../../../../generated/prisma';

import type { SellerStore } from '@community-marketplace/types';

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
    isPrimary: row.isPrimary,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
