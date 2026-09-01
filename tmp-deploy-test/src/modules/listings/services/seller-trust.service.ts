import { Injectable } from '@nestjs/common';

import type { SellerTrustProfile } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
    : Math.round(sorted[mid]!);
}

@Injectable()
export class SellerTrustService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(sellerId: string): Promise<SellerTrustProfile> {
    const summary = await this.getSummary(sellerId);
    const [user, activeListingCount, responseStats] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: sellerId },
        include: {
          profile: true,
          verifications: {
            where: { badgeGranted: true, status: 'approved' },
            take: 1,
          },
          _count: {
            select: {
              listings: { where: { status: 'active' } },
            },
          },
        },
      }),
      this.prisma.listing.count({
        where: { sellerId, status: 'active' },
      }),
      this.getResponseStats(sellerId),
    ]);

    return {
      ...summary,
      verified:
        (user?.sellerStatus === 'verified' || user?.idVerified) ||
        (user?.verifications.length ?? 0) > 0,
      phoneVerified: Boolean(user?.phoneVerifiedAt) || Boolean(user?.phoneVerified),
      sellerStatus: user?.sellerStatus,
      memberSince: user?.createdAt.toISOString(),
      activeListingCount: activeListingCount ?? user?._count?.listings ?? 0,
      responseRate: responseStats.responseRate,
      responseTimeMinutes: responseStats.responseTimeMinutes,
      isAmbassador: user?.profile?.isCommunityAmbassador ?? false,
      isBusiness: user?.profile?.isBusinessAccount ?? false,
    };
  }

  async getSummary(sellerId: string): Promise<SellerTrustProfile> {
    const map = await this.getSummariesForSellers([sellerId]);
    return map.get(sellerId) ?? { sellerId, reviewCount: 0, soldCount: 0 };
  }

  async getSummariesForSellers(sellerIds: string[]): Promise<Map<string, SellerTrustProfile>> {
    const unique = [...new Set(sellerIds.filter(Boolean))];
    const result = new Map<string, SellerTrustProfile>();
    if (unique.length === 0) return result;

    const [reviewGroups, soldGroups] = await Promise.all([
      this.prisma.sellerReview.groupBy({
        by: ['sellerId'],
        where: { sellerId: { in: unique } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.listing.groupBy({
        by: ['sellerId'],
        where: { sellerId: { in: unique }, status: 'sold' },
        _count: { id: true },
      }),
    ]);

    for (const id of unique) {
      result.set(id, { sellerId: id, reviewCount: 0, soldCount: 0 });
    }

    for (const row of reviewGroups) {
      const existing = result.get(row.sellerId)!;
      result.set(row.sellerId, {
        ...existing,
        averageRating: row._avg.rating ?? undefined,
        reviewCount: row._count.rating,
      });
    }

    for (const row of soldGroups) {
      const existing = result.get(row.sellerId)!;
      result.set(row.sellerId, {
        ...existing,
        soldCount: row._count.id,
      });
    }

    return result;
  }

  private async getResponseStats(sellerId: string): Promise<{
    responseRate?: number;
    responseTimeMinutes?: number;
  }> {
    const threads = await this.prisma.chatThread.findMany({
      where: { sellerId },
      take: 50,
      orderBy: { lastMessageAt: 'desc' },
      select: { id: true, buyerId: true, sellerId: true },
    });

    if (threads.length === 0) return {};

    let totalBuyerMessages = 0;
    let responded = 0;
    const responseTimes: number[] = [];

    for (const thread of threads) {
      const messages = await this.prisma.chatMessage.findMany({
        where: { threadId: thread.id, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { senderId: true, createdAt: true },
      });

      for (let i = 0; i < messages.length; i += 1) {
        const message = messages[i]!;
        if (message.senderId !== thread.buyerId) continue;
        totalBuyerMessages += 1;
        const reply = messages
          .slice(i + 1)
          .find((candidate) => candidate.senderId === thread.sellerId);
        if (reply) {
          responded += 1;
          responseTimes.push(
            (reply.createdAt.getTime() - message.createdAt.getTime()) / 60_000,
          );
        }
      }
    }

    if (totalBuyerMessages === 0) return {};

    return {
      responseRate: Math.round((responded / totalBuyerMessages) * 100),
      responseTimeMinutes: responseTimes.length > 0 ? median(responseTimes) : undefined,
    };
  }
}
