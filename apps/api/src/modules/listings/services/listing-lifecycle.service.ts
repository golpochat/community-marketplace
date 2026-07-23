import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  Listing,
  ListingPackageType,
  ListingStatus,
  ListingStatusActorType,
  ListingStatusChangeLog,
  RbacRole,
} from '@community-marketplace/types';
import { renewListingSchema } from '@community-marketplace/validation';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  computeExpiresAt,
  EXPIRY_WARNING_DAYS,
  isPaidPackage,
} from '../lib/listing-lifecycle.lib';
import { listingInclude, mapListing } from '../mappers/listing.mapper';
import { SellerListingGateService } from '../../seller/services/seller-listing-gate.service';
import { ListingAuditService } from './listing-audit.service';
import { ListingKeywordFilterService } from './listing-keyword-filter.service';
import { ListingReserveService } from './listing-reserve.service';

type PrismaListingStatus = ListingStatus;

/** Sellers may only re-activate listings that were previously approved and published. */
const SELLER_SELF_ACTIVATE_FROM: ListingStatus[] = ['paused'];

const ALLOWED_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  draft: ['pending_review', 'flagged'],
  pending_review: ['active', 'rejected', 'draft', 'flagged', 'under_investigation'],
  flagged: ['active', 'rejected', 'removed', 'pending_review', 'under_investigation'],
  under_investigation: ['active', 'rejected', 'removed', 'flagged', 'pending_review'],
  suspended_seller: ['draft', 'removed', 'active'],
  active: [
    'paused',
    'reserved',
    'sold',
    'ended',
    'removed',
    'expired',
    'flagged',
    'under_investigation',
    'suspended_seller',
  ],
  reserved: ['active', 'sold', 'paused', 'removed', 'flagged', 'under_investigation', 'suspended_seller'],
  paused: ['active', 'sold', 'ended', 'removed', 'expired', 'flagged', 'under_investigation', 'suspended_seller'],
  expired: ['active'],
  sold: [],
  ended: [],
  removed: ['expired', 'draft'],
  rejected: ['pending_review', 'draft'],
};

@Injectable()
export class ListingLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ListingAuditService,
    private readonly eventBus: EventBusService,
    private readonly sellerListingGate: SellerListingGateService,
    private readonly keywordFilters: ListingKeywordFilterService,
    private readonly reserves: ListingReserveService,
  ) {}

  async submitForReview(listingId: string, sellerId: string): Promise<Listing> {
    await this.sellerListingGate.assertCanSubmitForReview(sellerId);
    const imageCount = await this.prisma.listingImage.count({
      where: { listingId },
    });
    if (imageCount < 1) {
      throw new BadRequestException(
        'Add at least one photo before submitting this listing for review.',
      );
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true, description: true },
    });
    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }

    const keywordMatch = await this.keywordFilters.assertNotHardBlocked(
      listing.title,
      listing.description,
    );
    const softReasons = this.keywordFilters.formatSoftReasons(keywordMatch);

    const result = await this.transition({
      listingId,
      actorId: sellerId,
      actorRole: 'SELLER',
      toStatus: 'pending_review',
      changedByType: 'SELLER',
      eventType: 'listing.submitted_for_review',
      ...(softReasons.length ? { reason: softReasons.join('; ') } : {}),
    });

    return result;
  }

  cancelReview(listingId: string, sellerId: string): Promise<Listing> {
    return this.transition({
      listingId,
      actorId: sellerId,
      actorRole: 'SELLER',
      toStatus: 'draft',
      changedByType: 'SELLER',
    });
  }

  approve(listingId: string, adminId: string): Promise<Listing> {
    return this.activateListingAsAdmin(listingId, adminId);
  }

  rejectListing(
    listingId: string,
    adminId: string,
    reason: string,
    targetStep?: string,
  ): Promise<Listing> {
    return this.transition({
      listingId,
      actorId: adminId,
      actorRole: 'ADMIN',
      toStatus: 'rejected',
      changedByType: 'ADMIN',
      reason,
      extraData: {
        rejectionReason: reason.trim(),
        moderationHiddenAt: new Date(),
      },
      eventType: 'listing.rejected',
      eventPayload: { reason, ...(targetStep ? { targetStep } : {}) },
    });
  }

  investigateListing(listingId: string, adminId: string, reason?: string): Promise<Listing> {
    return this.transition({
      listingId,
      actorId: adminId,
      actorRole: 'ADMIN',
      toStatus: 'under_investigation',
      changedByType: 'ADMIN',
      reason,
      extraData: {
        moderationNotes: reason?.trim() ?? 'Marked for investigation',
        moderationHiddenAt: new Date(),
      },
      eventType: 'listing.under_investigation',
      eventPayload: { reason },
    });
  }

  /** @deprecated Sellers cannot self-publish; routes to submitForReview. */
  publishWithoutReview(listingId: string, sellerId: string): Promise<Listing> {
    return this.submitForReview(listingId, sellerId);
  }

  pauseListing(listingId: string, sellerId: string): Promise<Listing> {
    return this.transition({
      listingId,
      actorId: sellerId,
      actorRole: 'SELLER',
      toStatus: 'paused',
      changedByType: 'SELLER',
      eventType: 'listing.paused',
    }).then(async (listing) => {
      await this.reserves.cancelOpenForListing(listingId, 'cancelled_seller');
      return listing;
    });
  }

  resumeListing(listingId: string, sellerId: string): Promise<Listing> {
    return this.ensureNotPastExpiry(listingId, sellerId).then(() =>
      this.transition({
        listingId,
        actorId: sellerId,
        actorRole: 'SELLER',
        toStatus: 'active',
        changedByType: 'SELLER',
        eventType: 'listing.resumed',
      }),
    );
  }

  markSold(listingId: string, actorId: string, actorRole: RbacRole): Promise<Listing> {
    return this.transition({
      listingId,
      actorId,
      actorRole,
      toStatus: 'sold',
      changedByType: actorRole === 'SELLER' ? 'SELLER' : 'ADMIN',
      setEndedAt: true,
      eventType: 'listing.sold',
    }).then(async (listing) => {
      await this.reserves.cancelOpenForListing(listingId, 'cancelled_seller');
      return listing;
    });
  }

  markSoldFromPayment(listingId: string): Promise<Listing> {
    return this.transition({
      listingId,
      actorId: null,
      actorRole: 'ADMIN',
      toStatus: 'sold',
      changedByType: 'SYSTEM',
      setEndedAt: true,
      skipOwnershipCheck: true,
      eventType: 'listing.sold',
      eventPayload: { source: 'payment' },
    }).then(async (listing) => {
      // Safety net if called without buyer conversion path.
      await this.reserves.cancelOpenForListing(listingId, 'cancelled_seller');
      return listing;
    });
  }

  async markSoldFromPaymentWithBuyer(listingId: string, buyerId: string): Promise<Listing> {
    await this.reserves.markConvertedForListing(listingId, buyerId);
    return this.transition({
      listingId,
      actorId: null,
      actorRole: 'ADMIN',
      toStatus: 'sold',
      changedByType: 'SYSTEM',
      setEndedAt: true,
      skipOwnershipCheck: true,
      eventType: 'listing.sold',
      eventPayload: { source: 'payment' },
    });
  }

  endListing(listingId: string, sellerId: string): Promise<Listing> {
    return this.transition({
      listingId,
      actorId: sellerId,
      actorRole: 'SELLER',
      toStatus: 'ended',
      changedByType: 'SELLER',
      setEndedAt: true,
      eventType: 'listing.ended',
    }).then(async (listing) => {
      await this.reserves.cancelOpenForListing(listingId, 'cancelled_seller');
      return listing;
    });
  }

  removeListing(listingId: string, adminId: string, reason?: string): Promise<Listing> {
    return this.transition({
      listingId,
      actorId: adminId,
      actorRole: 'ADMIN',
      toStatus: 'removed',
      changedByType: 'ADMIN',
      reason,
      extraData: {
        removalReason: reason?.trim() ?? null,
        bannedAt: new Date(),
        bannedById: adminId,
      },
      setEndedAt: true,
      eventType: 'listing.removed',
      eventPayload: { reason },
    }).then(async (listing) => {
      await this.reserves.cancelOpenForListing(listingId, 'cancelled_seller');
      return listing;
    });
  }

  restoreListing(
    listingId: string,
    adminId: string,
    targetStatus: 'expired' | 'draft' = 'expired',
  ): Promise<Listing> {
    return this.transition({
      listingId,
      actorId: adminId,
      actorRole: 'ADMIN',
      toStatus: targetStatus,
      changedByType: 'ADMIN',
      extraData: {
        removalReason: null,
        bannedAt: null,
        bannedById: null,
        endedAt: null,
      },
      eventType: 'listing.restored',
    });
  }

  async renewListing(listingId: string, sellerId: string, input: unknown): Promise<Listing> {
    const parsed = renewListingSchema.parse(input);
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);
    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('You can only renew your own listings');
    }
    if (listing.status !== 'expired') {
      throw new BadRequestException('Only expired listings can be renewed');
    }

    const now = new Date();
    const packageType = parsed.packageType as ListingPackageType;
    if (isPaidPackage(packageType)) {
      throw new BadRequestException(
        'Paid boosts require checkout. Use POST /seller/monetization/boosts/intent.',
      );
    }

    const expiresAt = computeExpiresAt(now, packageType);

    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.listing.update({
        where: { id: listingId },
        data: {
          status: 'active',
          packageType,
          isPaid: isPaidPackage(packageType),
          activatedAt: now,
          expiresAt,
          endedAt: null,
        },
        include: listingInclude,
      });

      await this.logStatusChange(tx, {
        listingId,
        fromStatus: 'expired',
        toStatus: 'active',
        changedByType: 'SELLER',
        changedById: sellerId,
      });

      return updated;
    });

    await this.audit.record(listingId, 'listing_renewed', sellerId, {
      fromStatus: 'expired',
      toStatus: 'active',
      metadata: { packageType },
    });

    this.publishEvents(listingId, listing.sellerId, 'listing.renewed', { packageType });
    this.publishEvents(listingId, listing.sellerId, 'listing.updated');

    return mapListing(row);
  }

  async upgradePackage(listingId: string, sellerId: string, input: unknown): Promise<Listing> {
    const parsed = renewListingSchema.parse(input);
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);
    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('You can only upgrade your own listings');
    }
    if (listing.status !== 'active' && listing.status !== 'paused') {
      throw new BadRequestException('Only live or paused listings can be upgraded');
    }

    const now = new Date();
    const packageType = parsed.packageType as ListingPackageType;
    if (isPaidPackage(packageType)) {
      throw new BadRequestException(
        'Paid boosts require checkout. Use POST /seller/monetization/boosts/intent.',
      );
    }

    const expiresAt = computeExpiresAt(now, packageType);

    const row = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        packageType,
        isPaid: isPaidPackage(packageType),
        expiresAt,
      },
      include: listingInclude,
    });

    await this.audit.record(listingId, 'listing_updated', sellerId, {
      metadata: { packageType, expiresAt: expiresAt.toISOString(), action: 'package_upgraded' },
    });

    this.publishEvents(listingId, listing.sellerId, 'listing.package_upgraded', { packageType });
    this.publishEvents(listingId, listing.sellerId, 'listing.updated');

    return mapListing(row);
  }

  async expireDueListings(): Promise<number> {
    const now = new Date();
    const due = await this.prisma.listing.findMany({
      where: {
        status: { in: ['active', 'paused'] },
        expiresAt: { lte: now },
      },
      select: { id: true, sellerId: true, status: true },
    });

    for (const listing of due) {
      await this.transition({
        listingId: listing.id,
        actorId: null,
        actorRole: 'ADMIN',
        toStatus: 'expired',
        changedByType: 'SYSTEM',
        skipOwnershipCheck: true,
        eventType: 'listing.expired',
      });
    }

    return due.length;
  }

  async warnExpiringSoon(): Promise<number> {
    const now = new Date();
    const warningEnd = new Date(now);
    warningEnd.setDate(warningEnd.getDate() + 3);

    const listings = await this.prisma.listing.findMany({
      where: {
        status: { in: ['active', 'paused'] },
        expiresAt: { gt: now, lte: warningEnd },
      },
      select: { id: true, sellerId: true, expiresAt: true },
    });

    for (const listing of listings) {
      const alreadyNotified = await this.prisma.notification.findFirst({
        where: {
          userId: listing.sellerId,
          type: 'listing_expiring_soon',
          actionUrl: `/account/listings/${listing.id}/edit`,
          createdAt: { gte: new Date(now.getTime() - EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000) },
        },
        select: { id: true },
      });
      if (alreadyNotified) continue;

      this.eventBus.publish({
        type: 'listing.expiring_soon',
        payload: {
          listingId: listing.id,
          sellerId: listing.sellerId,
          expiresAt: listing.expiresAt?.toISOString(),
        },
        timestamp: new Date(),
      });
    }

    return listings.length;
  }

  async getStatusHistory(listingId: string): Promise<ListingStatusChangeLog[]> {
    const rows = await this.prisma.listingStatusChangeLog.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      listingId: row.listingId,
      fromStatus: row.fromStatus ?? undefined,
      toStatus: row.toStatus as ListingStatus,
      changedByType: row.changedByType as ListingStatusActorType,
      changedById: row.changedById ?? undefined,
      reason: row.reason ?? undefined,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  /** @deprecated Use removeListing */
  ban(listingId: string, adminId: string, moderationNotes?: string) {
    return this.removeListing(listingId, adminId, moderationNotes);
  }

  /** @deprecated Use restoreListing */
  unban(listingId: string, adminId: string) {
    return this.restoreListing(listingId, adminId, 'expired');
  }

  /** @deprecated Use endListing */
  archive(listingId: string, actorId: string, actorRole: RbacRole) {
    if (actorRole === 'SELLER') {
      return this.endListing(listingId, actorId);
    }
    return this.endListing(listingId, actorId);
  }

  /** @deprecated Use renewListing or resumeListing */
  unarchive(listingId: string, actorId: string, actorRole: RbacRole) {
    return this.resumeListing(listingId, actorId);
  }

  private async ensureNotPastExpiry(listingId: string, sellerId: string): Promise<void> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true, expiresAt: true },
    });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);
    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('You can only modify your own listings');
    }
    if (listing.expiresAt && listing.expiresAt <= new Date()) {
      throw new BadRequestException(
        'This listing has expired. Renew it to go live again.',
      );
    }
  }

  private async activateListingAsAdmin(
    listingId: string,
    adminId: string,
  ): Promise<Listing> {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);

    const fromStatus = listing.status as ListingStatus;
    const approvable: ListingStatus[] = [
      'pending_review',
      'draft',
      'flagged',
      'under_investigation',
    ];
    if (!approvable.includes(fromStatus)) {
      throw new BadRequestException(
        `Listing must be pending review, flagged, or under investigation to approve (current: ${fromStatus})`,
      );
    }

    const isFirstActivation = !listing.activatedAt;
    await this.sellerListingGate.assertCanActivateListing(
      listing.sellerId,
      isFirstActivation,
    );

    await this.keywordFilters.assertNotHardBlocked(
      listing.title,
      listing.description,
    );

    const now = new Date();
    const packageType = listing.packageType as ListingPackageType;
    const expiresAt = computeExpiresAt(now, packageType);

    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.listing.update({
        where: { id: listingId },
        data: {
          status: 'active',
          activatedAt: now,
          expiresAt,
          isPaid: isPaidPackage(packageType),
          rejectionReason: null,
          moderationHiddenAt: null,
          moderationNotes: null,
        },
        include: listingInclude,
      });

      await this.logStatusChange(tx, {
        listingId,
        fromStatus,
        toStatus: 'active',
        changedByType: 'ADMIN',
        changedById: adminId,
      });

      return updated;
    });

    await this.audit.record(listingId, 'listing_approved', adminId, {
      fromStatus,
      toStatus: 'active',
    });

    if (isFirstActivation) {
      const gateResult = await this.sellerListingGate.onListingActivated(listing.sellerId);
      if (gateResult.nudgeMessage) {
        this.eventBus.publish({
          type: 'seller.verification_nudge',
          payload: { sellerId: listing.sellerId, message: gateResult.nudgeMessage },
          timestamp: new Date(),
        });
      }
    }

    this.publishEvents(listingId, listing.sellerId, 'listing.approved');
    this.publishEvents(listingId, listing.sellerId, 'listing.updated');

    return mapListing(row);
  }

  private async transition(params: {
    listingId: string;
    actorId: string | null;
    actorRole: RbacRole;
    toStatus: ListingStatus;
    changedByType: ListingStatusActorType;
    reason?: string;
    extraData?: Record<string, unknown>;
    setEndedAt?: boolean;
    skipOwnershipCheck?: boolean;
    eventType?: string;
    eventPayload?: Record<string, unknown>;
  }): Promise<Listing> {
    const listing = await this.prisma.listing.findUnique({ where: { id: params.listingId } });
    if (!listing) throw new NotFoundException(`Listing ${params.listingId} not found`);

    const isAdmin = params.actorRole === 'ADMIN' || params.actorRole === 'SUPER_ADMIN';
    if (
      !params.skipOwnershipCheck &&
      !isAdmin &&
      params.actorId &&
      listing.sellerId !== params.actorId
    ) {
      throw new ForbiddenException('You can only modify your own listings');
    }

    if (!isAdmin && params.actorRole === 'SELLER' && params.actorId) {
      await this.sellerListingGate.assertSellerNotSuspended(params.actorId);
    }

    const fromStatus = listing.status as ListingStatus;
    if (
      !isAdmin &&
      params.actorRole === 'SELLER' &&
      params.toStatus === 'active' &&
      !SELLER_SELF_ACTIVATE_FROM.includes(fromStatus)
    ) {
      throw new ForbiddenException(
        'Only administrators can approve listings for publication',
      );
    }

    if (!ALLOWED_TRANSITIONS[fromStatus]?.includes(params.toStatus)) {
      throw new BadRequestException(
        `Cannot transition listing from ${fromStatus} to ${params.toStatus}`,
      );
    }

    const data: Record<string, unknown> = {
      status: params.toStatus,
      ...params.extraData,
    };
    if (params.setEndedAt) {
      data.endedAt = new Date();
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.listing.update({
        where: { id: params.listingId },
        data,
        include: listingInclude,
      });

      await this.logStatusChange(tx, {
        listingId: params.listingId,
        fromStatus,
        toStatus: params.toStatus,
        changedByType: params.changedByType,
        changedById: params.actorId ?? undefined,
        reason: params.reason,
      });

      return updated;
    });

    await this.audit.record(params.listingId, 'status_changed', params.actorId ?? undefined, {
      fromStatus,
      toStatus: params.toStatus,
      metadata: params.reason ? { reason: params.reason } : undefined,
    });

    if (params.eventType) {
      this.publishEvents(
        params.listingId,
        listing.sellerId,
        params.eventType,
        params.eventPayload,
      );
    }
    this.publishEvents(params.listingId, listing.sellerId, 'listing.updated');

    return mapListing(row);
  }

  private async logStatusChange(
    tx: Prisma.TransactionClient,
    input: {
      listingId: string;
      fromStatus: ListingStatus | null;
      toStatus: ListingStatus;
      changedByType: ListingStatusActorType;
      changedById?: string;
      reason?: string;
    },
  ) {
    await tx.listingStatusChangeLog.create({
      data: {
        listingId: input.listingId,
        fromStatus: input.fromStatus as PrismaListingStatus | null,
        toStatus: input.toStatus as PrismaListingStatus,
        changedByType: input.changedByType,
        changedById: input.changedById ?? null,
        reason: input.reason ?? null,
      },
    });
  }

  private publishEvents(
    listingId: string,
    sellerId: string,
    type: string,
    payload: Record<string, unknown> = {},
  ) {
    this.eventBus.publish({
      type,
      payload: { listingId, sellerId, ...payload },
      timestamp: new Date(),
    });
  }
}
