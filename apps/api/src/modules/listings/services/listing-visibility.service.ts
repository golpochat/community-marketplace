import { Injectable } from '@nestjs/common';
import type { ListingStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';

const PUBLIC_LISTING_STATUSES: ListingStatus[] = ['active', 'reserved'];

@Injectable()
export class ListingVisibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async isSellerRestricted(sellerId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { status: true },
    });
    if (!user || user.status !== 'active') return true;

    const activeBan = await this.prisma.userBan.findFirst({
      where: {
        userId: sellerId,
        liftedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true },
    });

    return Boolean(activeBan);
  }

  visibleListingWhere(extra?: Record<string, unknown>): Prisma.ListingWhereInput {
    return {
      status: { in: PUBLIC_LISTING_STATUSES },
      moderationHiddenAt: null,
      seller: {
        status: 'active',
        sellerStatus: { not: 'suspended' },
      },
      ...extra,
    } as Prisma.ListingWhereInput;
  }
}
