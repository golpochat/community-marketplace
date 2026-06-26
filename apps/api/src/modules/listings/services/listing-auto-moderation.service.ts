import { Injectable } from '@nestjs/common';

import type { ListingStatus } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { detectListingFraudSignals } from '../lib/listing-fraud.lib';
import { ModerationContentCheckService } from '../../moderation/services/moderation-content-check.service';

const HIGH_RISK_KEYWORDS = [
  'wire transfer',
  'western union',
  'gift card',
  'crypto only',
  'whatsapp only',
  'telegram only',
  'cash app only',
  'verify account',
  'stolen',
  'replica',
  'counterfeit',
];

export type ListingModerationTrigger =
  | 'unverified_high_risk'
  | 'seller_suspended'
  | 'user_report'
  | 'fraud_detection'
  | 'prohibited_content';

@Injectable()
export class ListingAutoModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly contentCheck: ModerationContentCheckService,
  ) {}

  async evaluateOnCreate(params: {
    listingId: string;
    sellerId: string;
    title: string;
    description: string;
    price: number;
    fraudRequiresReview: boolean;
    fraudReasons: string[];
  }): Promise<void> {
    const reasons = await this.collectReasons(params.sellerId, {
      title: params.title,
      description: params.description,
      price: params.price,
      fraudRequiresReview: params.fraudRequiresReview,
      fraudReasons: params.fraudReasons,
    });

    if (reasons.length) {
      await this.queueForReview(params.listingId, reasons, 'pending_review');
    }
  }

  async evaluateBeforePublish(listingId: string, sellerId: string): Promise<void> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        sellerId: true,
        title: true,
        description: true,
        price: true,
        requiresFraudReview: true,
        status: true,
      },
    });
    if (!listing || listing.sellerId !== sellerId) return;

    const reasons = await this.collectReasons(sellerId, {
      title: listing.title,
      description: listing.description,
      price: Number(listing.price),
      fraudRequiresReview: listing.requiresFraudReview,
      fraudReasons: listing.requiresFraudReview ? ['Fraud review required'] : [],
    });

    if (reasons.length) {
      await this.queueForReview(listingId, reasons, 'pending_review');
      throw new Error('LISTING_QUEUED_FOR_REVIEW');
    }
  }

  async onListingReported(listingId: string, reportReasons: string[]): Promise<void> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { status: true },
    });
    if (!listing || listing.status === 'removed' || listing.status === 'sold') return;

    const reason = `User report: ${reportReasons.join(', ')}`;
    const targetStatus: ListingStatus =
      reportReasons.includes('repeated_reports') || reportReasons.includes('scam_keywords')
        ? 'flagged'
        : 'pending_review';

    await this.queueForReview(listingId, [reason], targetStatus);
  }

  async onProhibitedContent(listingId: string, detail: string): Promise<void> {
    await this.queueForReview(
      listingId,
      [`Prohibited content detected: ${detail}`],
      'pending_review',
    );
  }

  async onSellerSuspended(sellerId: string): Promise<void> {
    const listings = await this.prisma.listing.findMany({
      where: {
        sellerId,
        status: { in: ['active', 'paused', 'pending_review', 'flagged', 'draft'] },
      },
      select: { id: true, status: true },
    });

    for (const listing of listings) {
      await this.applyStatus(
        listing.id,
        'suspended_seller',
        `Seller account suspended`,
        listing.status as ListingStatus,
      );
    }
  }

  private async collectReasons(
    sellerId: string,
    input: {
      title: string;
      description: string;
      price: number;
      fraudRequiresReview: boolean;
      fraudReasons: string[];
    },
  ): Promise<string[]> {
    const reasons: string[] = [];

    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { sellerStatus: true },
    });

    if (seller?.sellerStatus === 'suspended') {
      reasons.push('Seller account is suspended');
    }

    const combined = `${input.title} ${input.description}`.toLowerCase();
    const highRiskHits = HIGH_RISK_KEYWORDS.filter((kw) => combined.includes(kw));

    if (
      seller &&
      seller.sellerStatus !== 'verified' &&
      highRiskHits.length > 0
    ) {
      reasons.push(
        `Unverified seller listing contains high-risk keywords: ${highRiskHits.join(', ')}`,
      );
    }

    if (input.fraudRequiresReview) {
      reasons.push(...input.fraudReasons);
    }

    const contentResult = this.contentCheck.checkText(combined);
    if (contentResult.flagged) {
      reasons.push(`Content policy: ${contentResult.reasons.join(', ')}`);
    }

    const priceCheck = this.contentCheck.checkListingPrice(input.price);
    if (priceCheck.flagged) {
      reasons.push(`Suspicious pricing: ${priceCheck.reasons.join(', ')}`);
    }

    return [...new Set(reasons)];
  }

  private async queueForReview(
    listingId: string,
    reasons: string[],
    targetStatus: ListingStatus,
  ): Promise<void> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { status: true, sellerId: true },
    });
    if (!listing) return;

    const terminal: ListingStatus[] = ['sold', 'ended', 'removed'];
    if (terminal.includes(listing.status as ListingStatus)) return;

    const skip: ListingStatus[] = [
      'pending_review',
      'flagged',
      'under_investigation',
      'suspended_seller',
    ];
    if (skip.includes(listing.status as ListingStatus) && targetStatus === 'pending_review') {
      return;
    }

    await this.applyStatus(
      listingId,
      targetStatus,
      reasons.join('; '),
      listing.status as ListingStatus,
      listing.sellerId,
    );
  }

  private async applyStatus(
    listingId: string,
    toStatus: ListingStatus,
    reason: string,
    fromStatus: ListingStatus,
    sellerId?: string,
  ) {
    if (fromStatus === toStatus) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id: listingId },
        data: {
          status: toStatus,
          moderationNotes: reason,
          ...(toStatus === 'pending_review' || toStatus === 'flagged'
            ? { moderationHiddenAt: new Date() }
            : {}),
        },
      });

      await tx.listingStatusChangeLog.create({
        data: {
          listingId,
          fromStatus,
          toStatus,
          changedByType: 'SYSTEM',
          reason,
        },
      });
    });

    this.eventBus.publish({
      type: 'listing.moderation_queued',
      payload: {
        listingId,
        sellerId,
        fromStatus,
        toStatus,
        reason,
      },
      timestamp: new Date(),
    });

    if (sellerId) {
      this.eventBus.publish({
        type: 'listing.updated',
        payload: { listingId, sellerId },
        timestamp: new Date(),
      });
    }
  }
}
