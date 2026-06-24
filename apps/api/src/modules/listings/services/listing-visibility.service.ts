import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

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
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true },
    });

    return Boolean(activeBan);
  }

  visibleListingWhere(extra?: Record<string, unknown>) {
    return {
      status: 'active' as const,
      moderationHiddenAt: null,
      seller: { status: 'active' as const },
      ...extra,
    };
  }
}
