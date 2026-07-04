import type { MonetizationProduct } from '@community-marketplace/types';
import type { MonetizationProduct as MonetizationProductRow } from '@prisma/client';

export function mapMonetizationProduct(row: MonetizationProductRow): MonetizationProduct {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    type: row.type as MonetizationProduct['type'],
    status: row.status as MonetizationProduct['status'],
    price: Number(row.price),
    currency: row.currency,
    durationDays: row.durationDays ?? undefined,
    durationHours: row.durationHours ?? undefined,
    placement: row.placement ?? undefined,
    packageType: (row.packageType as MonetizationProduct['packageType']) ?? undefined,
    slotsPerDay: row.slotsPerDay ?? undefined,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
