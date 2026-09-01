import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ListingAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getForListing(listingId: string, sellerId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, sellerId },
      select: { id: true, viewCount: true, favoriteCount: true },
    });
    if (!listing) return null;

    return {
      listingId: listing.id,
      viewCount: listing.viewCount,
      favoriteCount: listing.favoriteCount,
    };
  }

  async getSellerSummary(sellerId: string) {
    const [active, sold, ended, views, favorites] = await Promise.all([
      this.prisma.listing.count({ where: { sellerId, status: 'active' } }),
      this.prisma.listing.count({ where: { sellerId, status: 'sold' } }),
      this.prisma.listing.count({ where: { sellerId, status: 'ended' } }),
      this.prisma.listing.aggregate({
        where: { sellerId },
        _sum: { viewCount: true },
      }),
      this.prisma.listing.aggregate({
        where: { sellerId },
        _sum: { favoriteCount: true },
      }),
    ]);

    return {
      activeCount: active,
      soldCount: sold,
      archivedCount: ended,
      totalViews: views._sum.viewCount ?? 0,
      totalFavorites: favorites._sum.favoriteCount ?? 0,
    };
  }
}
