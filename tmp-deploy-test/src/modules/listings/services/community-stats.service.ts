import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { RedisCacheService } from '../../../libs/redis-cache.service';

export interface CommunityPublicStats {
  memberCount: number;
  activeListings: number;
  soldToday: number;
  newListingsToday: number;
  verifiedSellers: number;
}

@Injectable()
export class CommunityStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async getPublicStats(): Promise<CommunityPublicStats> {
    const cacheKey = 'public:community:stats';
    const cached = await this.cache.get<CommunityPublicStats>(cacheKey);
    if (cached) return cached;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      memberCount,
      activeListings,
      soldToday,
      newListingsToday,
      verifiedSellers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { status: 'active' } }),
      this.prisma.listing.count({ where: { status: 'active' } }),
      this.prisma.listing.count({
        where: { status: 'sold', updatedAt: { gte: startOfDay } },
      }),
      this.prisma.listing.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.userVerification.count({
        where: { status: 'approved', badgeGranted: true },
      }),
    ]);

    const stats: CommunityPublicStats = {
      memberCount,
      activeListings,
      soldToday,
      newListingsToday,
      verifiedSellers,
    };

    await this.cache.set(cacheKey, stats, 120);
    return stats;
  }
}
