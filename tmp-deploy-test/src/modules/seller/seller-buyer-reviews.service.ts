import { BadRequestException, Injectable } from '@nestjs/common';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

import type { PendingReviewItem } from '@community-marketplace/types';

import { PrismaService } from '../../database/prisma.service';

export class CreateBuyerReviewDto {
  @IsUUID()
  listingId!: string;

  @IsUUID()
  buyerId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export interface BuyerReviewRecord {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

@Injectable()
export class SellerBuyerReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(sellerId: string, dto: CreateBuyerReviewDto): Promise<BuyerReviewRecord> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: { id: true, sellerId: true },
    });
    if (!listing || listing.sellerId !== sellerId) {
      throw new BadRequestException('Listing not found for this seller');
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        listingId: dto.listingId,
        sellerId,
        buyerId: dto.buyerId,
        status: 'succeeded',
      },
    });
    if (!payment) {
      throw new BadRequestException('You can only review buyers after a completed sale');
    }

    const row = await this.prisma.buyerReview.upsert({
      where: {
        sellerId_listingId: { sellerId, listingId: dto.listingId },
      },
      create: {
        buyerId: dto.buyerId,
        sellerId,
        listingId: dto.listingId,
        paymentId: payment.id,
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
      buyerId: row.buyerId,
      sellerId: row.sellerId,
      listingId: row.listingId ?? undefined,
      rating: row.rating,
      comment: row.comment ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async findPendingForSeller(sellerId: string): Promise<PendingReviewItem[]> {
    const payments = await this.prisma.payment.findMany({
      where: { sellerId, status: 'succeeded' },
      include: {
        listing: { select: { id: true, title: true } },
        buyer: { select: { id: true, displayName: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    if (payments.length === 0) return [];

    const reviewedListingIds = new Set(
      (
        await this.prisma.buyerReview.findMany({
          where: { sellerId, listingId: { in: payments.map((p) => p.listingId) } },
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
        counterpartyId: payment.buyerId,
        counterpartyName: payment.buyer.displayName ?? payment.buyer.email,
        completedAt: payment.updatedAt.toISOString(),
      }));
  }
}
