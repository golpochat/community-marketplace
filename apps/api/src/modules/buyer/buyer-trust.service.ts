import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import type { BuyerTrustProfile } from '@community-marketplace/types';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BuyerTrustService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(buyerId: string): Promise<BuyerTrustProfile> {
    const [user, aggregate, completedTransactions, disputeCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: buyerId },
        include: { profile: true },
      }),
      this.prisma.buyerReview.aggregate({
        where: { buyerId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.payment.count({
        where: { buyerId, status: 'succeeded' },
      }),
      this.prisma.paymentDispute.count({
        where: {
          payment: { buyerId },
          status: { in: ['open', 'under_review'] },
        },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('Buyer not found');
    }

    return {
      buyerId,
      averageRating: aggregate._avg.rating ?? undefined,
      reviewCount: aggregate._count.rating,
      completedTransactions,
      hasDisputes: disputeCount > 0,
      phoneVerified: Boolean(user.phoneVerifiedAt),
      isCommunityMember: Boolean(user.profile?.communityArea?.trim()),
      memberSince: user.createdAt.toISOString(),
    };
  }

  async getProfileForSeller(viewerId: string, buyerId: string, viewerRole: string): Promise<BuyerTrustProfile> {
    if (viewerRole !== 'SELLER' && viewerRole !== 'ADMIN') {
      throw new ForbiddenException('Only sellers can view buyer trust profiles');
    }
    void viewerId;
    return this.getProfile(buyerId);
  }
}
