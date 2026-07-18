import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  ListingPricingFields,
  PriceUpdateResult,
  PricingPreview,
  RbacRole,
} from '@community-marketplace/types';
import { listingEditActionUrl } from '@community-marketplace/types';
import { updateListingPricingSchema } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  computeListingPricing,
  MAX_AUTO_APPROVE_DISCOUNT_PERCENT,
} from '../lib/listing-pricing.lib';
import { mapPriceChangeLog, mapPricingFromListing } from '../mappers/pricing.mapper';
import { mapListingImage } from '../mappers/listing.mapper';
import { SellerListingGateService } from '../../seller/services/seller-listing-gate.service';

const HIGH_RISK_CATEGORY_SLUGS = new Set(['vehicles', 'electronics']);

@Injectable()
export class ListingPricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly notifications: NotificationsService,
    private readonly sellerListingGate: SellerListingGateService,
  ) {}

  resolvePricing(input: unknown): ListingPricingFields {
    const parsed = updateListingPricingSchema.parse(input);
    const computed = computeListingPricing(parsed);
    return {
      price: computed.price,
      originalPrice: computed.originalPrice,
      salePrice: computed.salePrice,
      discountPercent: computed.discountPercent,
    };
  }

  async saveForDraftListing(listingId: string, input: unknown) {
    const pricing = this.resolvePricing(input);
    await this.applyPricing(listingId, pricing);
  }

  async getSellerPricingState(listingId: string, sellerId: string, role: RbacRole) {
    const listing = await this.assertCanManagePricing(listingId, sellerId, role);
    const pricing = mapPricingFromListing(listing);
    const pendingLog = await this.prisma.priceChangeLog.findFirst({
      where: { listingId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingLog) {
      return {
        pricing,
        pendingPricing: {
          price: Number(pendingLog.newSalePrice ?? pendingLog.newOriginalPrice ?? listing.price),
          originalPrice:
            pendingLog.newOriginalPrice != null
              ? Number(pendingLog.newOriginalPrice)
              : undefined,
          salePrice:
            pendingLog.newSalePrice != null ? Number(pendingLog.newSalePrice) : undefined,
          discountPercent: pendingLog.discountPercent ?? undefined,
        },
        priceReviewStatus: 'pending-review' as const,
        pendingChangeLogId: pendingLog.id,
      };
    }

    const latestLog = await this.prisma.priceChangeLog.findFirst({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
    });

    if (latestLog?.status === 'REJECTED') {
      return {
        pricing,
        pendingPricing: {
          price: Number(latestLog.newSalePrice ?? latestLog.newOriginalPrice ?? listing.price),
          originalPrice:
            latestLog.newOriginalPrice != null
              ? Number(latestLog.newOriginalPrice)
              : undefined,
          salePrice:
            latestLog.newSalePrice != null ? Number(latestLog.newSalePrice) : undefined,
          discountPercent: latestLog.discountPercent ?? undefined,
        },
        priceReviewStatus: 'rejected' as const,
        pendingChangeLogId: latestLog.id,
        reviewNotes: latestLog.reviewNotes ?? undefined,
      };
    }

    return {
      pricing,
      priceReviewStatus: 'none' as const,
    };
  }

  async buildPreview(
    listingId: string,
    sellerId: string,
    role: RbacRole,
    input: unknown,
  ): Promise<PricingPreview> {
    const listing = await this.assertCanManagePricing(listingId, sellerId, role);
    const current = mapPricingFromListing(listing);
    const proposed = this.resolvePricing(input);
    const computed = computeListingPricing({
      originalPrice: proposed.originalPrice,
      salePrice: proposed.salePrice,
      price: proposed.price,
    });
    const review = await this.evaluateSoftReview(listing, current, proposed);

    return {
      listingId,
      listingTitle: listing.title,
      listingStatus: listing.status,
      current,
      proposed,
      savingsAmount: computed.savingsAmount,
      badgeLabel: computed.badgeLabel,
      wouldRequireReview: review.requiresReview,
      reviewReasons: review.reasons,
      coverImage: listing.images[0] ? mapListingImage(listing.images[0]) : undefined,
    };
  }

  async updatePricing(
    listingId: string,
    sellerId: string,
    role: RbacRole,
    input: unknown,
  ): Promise<PriceUpdateResult> {
    const preview = await this.buildPreview(listingId, sellerId, role, input);
    const listing = await this.assertCanManagePricing(listingId, sellerId, role);

    if (listing.status !== 'active') {
      await this.applyPricing(listingId, preview.proposed);
      return {
        status: 'auto-approved',
        preview,
        pricing: preview.proposed,
      };
    }

    const existingPending = await this.prisma.priceChangeLog.findFirst({
      where: { listingId, status: 'PENDING' },
    });
    if (existingPending) {
      throw new BadRequestException(
        'A price change is already pending review. Wait for an admin decision before submitting again.',
      );
    }

    const review = await this.evaluateSoftReview(
      listing,
      preview.current,
      preview.proposed,
    );

    const changeLog = await this.prisma.priceChangeLog.create({
      data: {
        listingId,
        sellerId,
        oldOriginalPrice: preview.current.originalPrice ?? null,
        oldSalePrice: preview.current.salePrice ?? preview.current.price,
        newOriginalPrice: preview.proposed.originalPrice ?? null,
        newSalePrice: preview.proposed.salePrice ?? preview.proposed.price,
        discountPercent: preview.proposed.discountPercent ?? null,
        requiresReview: review.requiresReview,
        status: review.requiresReview ? 'PENDING' : 'APPROVED',
        reviewedAt: review.requiresReview ? null : new Date(),
      },
    });

    if (!review.requiresReview) {
      await this.applyPricing(listingId, preview.proposed);
      this.eventBus.publish({
        type: 'pricing.change_approved',
        payload: { listingId, sellerId, changeLogId: changeLog.id, auto: true },
        timestamp: new Date(),
      });
      return {
        status: 'auto-approved',
        preview,
        changeLogId: changeLog.id,
        pricing: preview.proposed,
      };
    }

    await this.notifications.send({
      userId: sellerId,
      type: 'price_review_pending',
      title: 'Price change pending review',
      body: 'Your price update is under review. Buyers still see your current prices.',
      actionUrl: listingEditActionUrl(listingId, 'pricing'),
    });

    return {
      status: 'pending-review',
      preview,
      changeLogId: changeLog.id,
      pricing: preview.current,
      pendingPricing: preview.proposed,
    };
  }

  async listPendingReviews(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.priceChangeLog.findMany({
        where: { status: 'PENDING', requiresReview: true },
        include: {
          listing: { select: { id: true, title: true, status: true } },
          seller: { select: { id: true, displayName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.priceChangeLog.count({
        where: { status: 'PENDING', requiresReview: true },
      }),
    ]);

    return {
      data: rows.map(mapPriceChangeLog),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async approveChange(changeLogId: string, adminId: string, reviewNotes?: string) {
    const log = await this.getPendingLog(changeLogId);
    const pricing: ListingPricingFields = {
      price: Number(log.newSalePrice ?? log.newOriginalPrice),
      originalPrice: log.newOriginalPrice != null ? Number(log.newOriginalPrice) : undefined,
      salePrice: log.newSalePrice != null ? Number(log.newSalePrice) : undefined,
      discountPercent: log.discountPercent ?? undefined,
    };

    await this.applyPricing(log.listingId, pricing);
    await this.prisma.priceChangeLog.update({
      where: { id: changeLogId },
      data: {
        status: 'APPROVED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes ?? null,
      },
    });

    const listing = await this.prisma.listing.findUnique({ where: { id: log.listingId } });
    const resultPricing = listing ? mapPricingFromListing(listing) : pricing;

    await this.notifications.send({
      userId: log.sellerId,
      type: 'price_change_approved',
      title: 'Price change approved',
      body: 'Your updated prices are now visible to buyers.',
      actionUrl: listingEditActionUrl(log.listingId, 'pricing'),
    });

    return { changeLogId, pricing: resultPricing };
  }

  async rejectChange(changeLogId: string, adminId: string, reviewNotes?: string) {
    const log = await this.getPendingLog(changeLogId);

    await this.prisma.priceChangeLog.update({
      where: { id: changeLogId },
      data: {
        status: 'REJECTED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes ?? null,
      },
    });

    const listing = await this.prisma.listing.findUnique({ where: { id: log.listingId } });
    const pricing = listing ? mapPricingFromListing(listing) : mapPricingFromListing({
      price: log.oldSalePrice ?? log.oldOriginalPrice ?? 0,
      originalPrice: log.oldOriginalPrice,
      salePrice: log.oldSalePrice,
      discountPercent: null,
    });

    await this.notifications.send({
      userId: log.sellerId,
      type: 'price_change_rejected',
      title: 'Price change rejected',
      body:
        reviewNotes?.trim() ||
        'Your proposed price change was not approved. Previous prices remain in effect.',
      actionUrl: listingEditActionUrl(log.listingId, 'pricing'),
    });

    return { changeLogId, pricing };
  }

  private async getPendingLog(changeLogId: string) {
    const log = await this.prisma.priceChangeLog.findUnique({
      where: { id: changeLogId },
    });
    if (!log || log.status !== 'PENDING') {
      throw new NotFoundException('Pending price review not found');
    }
    return log;
  }

  private async assertCanManagePricing(listingId: string, actorId: string, role: RbacRole) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        category: { select: { slug: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);

    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (!isAdmin && listing.sellerId !== actorId) {
      throw new ForbiddenException('You can only update pricing for your own listings');
    }
    if (!isAdmin) {
      await this.sellerListingGate.assertSellerNotSuspended(actorId);
    }
    return listing;
  }

  private async applyPricing(listingId: string, pricing: ListingPricingFields) {
    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        price: pricing.price,
        originalPrice: pricing.originalPrice ?? null,
        salePrice: pricing.salePrice ?? pricing.price,
        discountPercent: pricing.discountPercent ?? null,
      },
    });
  }

  private async evaluateSoftReview(
    listing: {
      id: string;
      sellerId: string;
      status: string;
      price: { toNumber(): number };
      category: { slug: string };
    },
    current: ListingPricingFields,
    proposed: ListingPricingFields,
  ): Promise<{ requiresReview: boolean; reasons: string[] }> {
    if (listing.status !== 'active') {
      return { requiresReview: false, reasons: [] };
    }

    const reasons: string[] = [];
    const discount = proposed.discountPercent ?? 0;

    if (discount > MAX_AUTO_APPROVE_DISCOUNT_PERCENT) {
      reasons.push(`Discount exceeds ${MAX_AUTO_APPROVE_DISCOUNT_PERCENT}%`);
    }

    const oldEffective = current.originalPrice ?? current.price;
    const newEffective = proposed.price;
    if (oldEffective >= 500 && newEffective < oldEffective * 0.3) {
      reasons.push('Sudden large price drop from a high original price');
    }

    if (HIGH_RISK_CATEGORY_SLUGS.has(listing.category.slug) && discount > 50) {
      reasons.push(`Large discount on high-risk category (${listing.category.slug})`);
    }

    if (await this.sellerHasDisputes(listing.sellerId)) {
      reasons.push('Seller has prior payment disputes');
    }

    if (await this.sellerHasRejectedPriceChanges(listing.sellerId)) {
      reasons.push('Seller has previous rejected price changes');
    }

    return { requiresReview: reasons.length > 0, reasons };
  }

  private async sellerHasDisputes(sellerId: string): Promise<boolean> {
    const count = await this.prisma.paymentDispute.count({
      where: {
        payment: { sellerId },
        status: { in: ['open', 'under_review', 'lost'] },
      },
    });
    return count > 0;
  }

  private async sellerHasRejectedPriceChanges(sellerId: string): Promise<boolean> {
    const count = await this.prisma.priceChangeLog.count({
      where: { sellerId, status: 'REJECTED' },
    });
    return count > 0;
  }
}
