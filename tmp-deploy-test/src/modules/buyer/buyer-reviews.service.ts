import { BadRequestException, Injectable } from '@nestjs/common';

import type { PendingReviewItem } from '@community-marketplace/types';

import { PrismaService } from '../../database/prisma.service';
import { CreateReviewDto } from './dto/buyer.dto';

export interface ReviewRecord {
  id: string;
  userId: string;
  sellerId: string;
  listingId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

@Injectable()
export class BuyerReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto): Promise<ReviewRecord> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: { id: true, sellerId: true },
    });
    if (!listing) {
      throw new BadRequestException('Listing not found');
    }
    if (listing.sellerId === userId) {
      throw new BadRequestException('You cannot review your own listing');
    }

    const hasCompletedPurchase = await this.prisma.payment.findFirst({
      where: {
        buyerId: userId,
        listingId: dto.listingId,
        status: 'succeeded',
      },
    });
    if (!hasCompletedPurchase) {
      throw new BadRequestException('You can only review sellers after a completed purchase');
    }

    const row = await this.prisma.sellerReview.upsert({
      where: {
        buyerId_listingId: { buyerId: userId, listingId: dto.listingId },
      },
      create: {
        buyerId: userId,
        sellerId: listing.sellerId,
        listingId: dto.listingId,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
      update: {
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
    });

    return {
      id: row.id,
      userId: row.buyerId,
      sellerId: row.sellerId,
      listingId: row.listingId ?? undefined,
      rating: row.rating,
      comment: row.comment ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  findByUser(userId: string): Promise<ReviewRecord[]> {
    return this.prisma.sellerReview
      .findMany({
        where: { buyerId: userId },
        orderBy: { createdAt: 'desc' },
      })
      .then((rows) =>
        rows.map((row) => ({
          id: row.id,
          userId: row.buyerId,
          sellerId: row.sellerId,
          listingId: row.listingId ?? undefined,
          rating: row.rating,
          comment: row.comment ?? undefined,
          createdAt: row.createdAt.toISOString(),
        })),
      );
  }

  async findPendingForBuyer(userId: string): Promise<PendingReviewItem[]> {
    const payments = await this.prisma.payment.findMany({
      where: { buyerId: userId, status: 'succeeded' },
      include: {
        listing: { select: { id: true, title: true } },
        seller: { select: { id: true, displayName: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    if (payments.length === 0) return [];

    const reviewedListingIds = new Set(
      (
        await this.prisma.sellerReview.findMany({
          where: { buyerId: userId, listingId: { in: payments.map((p) => p.listingId) } },
          select: { listingId: true },
        })
      )
        .map((row) => row.listingId)
        .filter(Boolean),
    );

    return payments
      .filter((payment) => !reviewedListingIds.has(payment.listingId))
      .map((payment) => ({
        listingId: payment.listingId,
        listingTitle: payment.listing.title,
        paymentId: payment.id,
        counterpartyId: payment.sellerId,
        counterpartyName: payment.seller.displayName ?? payment.seller.email,
        completedAt: payment.updatedAt.toISOString(),
      }));
  }

  async getSellerSummary(sellerId: string): Promise<{
    averageRating: number;
    reviewCount: number;
    soldCount: number;
  }> {
    const [aggregate, soldCount] = await Promise.all([
      this.prisma.sellerReview.aggregate({
        where: { sellerId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.listing.count({
        where: { sellerId, status: 'sold' },
      }),
    ]);

    return {
      averageRating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count.rating,
      soldCount,
    };
  }
}
