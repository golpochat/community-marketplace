import { BadRequestException } from '@nestjs/common';
import type { ListingStatus, PrismaClient } from '@prisma/client';

import {
  normalizeVehicleVin,
  parseVehicleAttributes,
} from '@community-marketplace/utils';

const OCCUPIED_LISTING_STATUSES: ListingStatus[] = [
  'draft',
  'pending_review',
  'active',
  'paused',
  'flagged',
  'under_investigation',
];

export async function assertVehicleUnitAvailable(
  prisma: PrismaClient,
  sellerId: string,
  attributes: unknown,
  excludeListingId?: string,
): Promise<void> {
  const attrs = parseVehicleAttributes(attributes);
  const vin = normalizeVehicleVin(attrs?.vin);
  if (!vin) return;

  const candidates = await prisma.listing.findMany({
    where: {
      sellerId,
      status: { in: OCCUPIED_LISTING_STATUSES },
      ...(excludeListingId ? { id: { not: excludeListingId } } : {}),
    },
    select: { id: true, title: true, attributes: true },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });

  const conflict = candidates.find((row) => {
    const other = parseVehicleAttributes(row.attributes);
    return normalizeVehicleVin(other?.vin) === vin;
  });

  if (conflict) {
    throw new BadRequestException(
      `This VIN is already on your listing "${conflict.title}". Each vehicle needs its own listing.`,
    );
  }
}
