import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  DeliveryPreview,
  DeliveryUpdateResult,
  ListingDeliverySelection,
  RbacRole,
} from '@community-marketplace/types';
import { listingEditActionUrl } from '@community-marketplace/types';
import {
  updateListingDeliverySchema,
  type ListingDeliverySelectionInput,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  buildDeliveryDiff,
  listingDeliveryInclude,
  mapDeliveryChangeLog,
  mapListingDeliverySelection,
} from '../mappers/delivery.mapper';
import { SellerListingGateService } from '../../seller/services/seller-listing-gate.service';
import { DeliveryOptionsService } from './delivery-options.service';

const HIGH_RISK_CATEGORY_SLUGS = new Set(['vehicles', 'electronics']);
const MAX_AUTO_APPROVE_FEE = 200;

@Injectable()
export class ListingDeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: DeliveryOptionsService,
    private readonly eventBus: EventBusService,
    private readonly notifications: NotificationsService,
    private readonly sellerListingGate: SellerListingGateService,
  ) {}

  async getListingDeliveryOptions(listingId: string): Promise<ListingDeliverySelection[]> {
    const rows = await this.prisma.listingDeliveryOption.findMany({
      where: { listingId },
      include: listingDeliveryInclude,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(mapListingDeliverySelection);
  }

  async getSellerDeliveryState(listingId: string, sellerId: string, role: RbacRole) {
    await this.assertCanManageDelivery(listingId, sellerId, role);
    const deliveryOptions = await this.getListingDeliveryOptions(listingId);
    const pendingLog = await this.prisma.deliveryChangeLog.findFirst({
      where: { listingId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingLog) {
      const snapshot = pendingLog.changes as {
        after?: ListingDeliverySelection[];
      };
      return {
        deliveryOptions,
        pendingDeliveryOptions: snapshot.after ?? undefined,
        deliveryReviewStatus: 'pending-review' as const,
        pendingChangeLogId: pendingLog.id,
      };
    }

    const latestLog = await this.prisma.deliveryChangeLog.findFirst({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
    });

    if (latestLog?.status === 'REJECTED') {
      const snapshot = latestLog.changes as {
        after?: ListingDeliverySelection[];
      };
      return {
        deliveryOptions,
        pendingDeliveryOptions: snapshot.after ?? undefined,
        deliveryReviewStatus: 'rejected' as const,
        pendingChangeLogId: latestLog.id,
        reviewNotes: latestLog.reviewNotes ?? undefined,
      };
    }

    return {
      deliveryOptions,
      deliveryReviewStatus: 'none' as const,
    };
  }

  async getPendingDeliveryOptions(listingId: string): Promise<ListingDeliverySelection[] | undefined> {
    const pending = await this.prisma.deliveryChangeLog.findFirst({
      where: { listingId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    if (!pending) return undefined;
    const snapshot = pending.changes as { after?: ListingDeliverySelection[] };
    return snapshot.after ?? undefined;
  }

  async saveForDraftListing(listingId: string, selections: ListingDeliverySelectionInput[]) {
    await this.validateSelections(selections);
    await this.replaceListingOptions(listingId, selections);
  }

  async buildPreview(
    listingId: string,
    sellerId: string,
    role: RbacRole,
    input: unknown,
  ): Promise<DeliveryPreview> {
    const parsed = updateListingDeliverySchema.parse(input);
    const listing = await this.assertCanManageDelivery(listingId, sellerId, role);
    const current = await this.getListingDeliveryOptions(listingId);
    const proposed = await this.resolveSelections(parsed.selections);
    const review = await this.evaluateSoftReview(listing, current, proposed);

    return {
      listingId,
      listingTitle: listing.title,
      listingStatus: listing.status,
      current,
      proposed,
      diff: buildDeliveryDiff(current, proposed),
      wouldRequireReview: review.requiresReview,
      reviewReasons: review.reasons,
    };
  }

  async updateDelivery(
    listingId: string,
    sellerId: string,
    role: RbacRole,
    input: unknown,
  ): Promise<DeliveryUpdateResult> {
    const preview = await this.buildPreview(listingId, sellerId, role, input);
    const listing = await this.assertCanManageDelivery(listingId, sellerId, role);

    if (listing.status !== 'active') {
      await this.replaceListingOptions(listingId, preview.proposed);
      return {
        status: 'auto-approved',
        preview,
        deliveryOptions: preview.proposed,
      };
    }

    const existingPending = await this.prisma.deliveryChangeLog.findFirst({
      where: { listingId, status: 'PENDING' },
    });
    if (existingPending) {
      throw new BadRequestException(
        'A delivery change is already pending review. Wait for an admin decision before submitting again.',
      );
    }

    const review = await this.evaluateSoftReview(
      listing,
      preview.current,
      preview.proposed,
    );

    const changeLog = await this.prisma.deliveryChangeLog.create({
      data: {
        listingId,
        sellerId,
        changes: {
          before: preview.current,
          after: preview.proposed,
          reviewReasons: review.reasons,
        } as object,
        requiresReview: review.requiresReview,
        status: review.requiresReview ? 'PENDING' : 'APPROVED',
        reviewedAt: review.requiresReview ? null : new Date(),
      },
    });

    if (!review.requiresReview) {
      await this.replaceListingOptions(listingId, preview.proposed);
      this.eventBus.publish({
        type: 'delivery.change_approved',
        payload: { listingId, sellerId, changeLogId: changeLog.id, auto: true },
        timestamp: new Date(),
      });
      return {
        status: 'auto-approved',
        preview,
        changeLogId: changeLog.id,
        deliveryOptions: preview.proposed,
      };
    }

    await this.notifications.send({
      userId: sellerId,
      type: 'delivery_review_pending',
      title: 'Delivery changes pending review',
      body: 'Your delivery updates are under review. Your listing stays live with current delivery options.',
      actionUrl: listingEditActionUrl(listingId, 'delivery'),
    });

    this.eventBus.publish({
      type: 'delivery.change_pending',
      payload: { listingId, sellerId, changeLogId: changeLog.id },
      timestamp: new Date(),
    });

    return {
      status: 'pending-review',
      preview,
      changeLogId: changeLog.id,
      deliveryOptions: preview.current,
      pendingDeliveryOptions: preview.proposed,
    };
  }

  async listPendingReviews(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.deliveryChangeLog.findMany({
        where: { status: 'PENDING', requiresReview: true },
        include: {
          listing: { select: { id: true, title: true, status: true } },
          seller: { select: { id: true, displayName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.deliveryChangeLog.count({
        where: { status: 'PENDING', requiresReview: true },
      }),
    ]);

    return {
      data: rows.map(mapDeliveryChangeLog),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async approveChange(changeLogId: string, adminId: string, reviewNotes?: string) {
    const log = await this.getPendingLog(changeLogId);
    const snapshot = log.changes as { after: ListingDeliverySelectionInput[] };
    const selections = snapshot.after.map((item) => ({
      deliveryOptionId: item.deliveryOptionId,
      customLabel: item.customLabel,
      customPrice: item.customPrice,
    }));

    await this.validateSelections(selections);
    await this.replaceListingOptions(log.listingId, selections);

    await this.prisma.deliveryChangeLog.update({
      where: { id: changeLogId },
      data: {
        status: 'APPROVED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes ?? null,
      },
    });

    const deliveryOptions = await this.getListingDeliveryOptions(log.listingId);

    await this.notifications.send({
      userId: log.sellerId,
      type: 'delivery_change_approved',
      title: 'Delivery changes approved',
      body: 'Your delivery options have been updated and are now visible to buyers.',
      actionUrl: listingEditActionUrl(log.listingId, 'delivery'),
    });

    return { changeLogId, deliveryOptions };
  }

  async rejectChange(changeLogId: string, adminId: string, reviewNotes?: string) {
    const log = await this.getPendingLog(changeLogId);

    await this.prisma.deliveryChangeLog.update({
      where: { id: changeLogId },
      data: {
        status: 'REJECTED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes ?? null,
      },
    });

    const deliveryOptions = await this.getListingDeliveryOptions(log.listingId);

    await this.notifications.send({
      userId: log.sellerId,
      type: 'delivery_change_rejected',
      title: 'Delivery changes rejected',
      body:
        reviewNotes?.trim() ||
        'Your proposed delivery changes were not approved. Previous delivery options remain in effect.',
      actionUrl: listingEditActionUrl(log.listingId, 'delivery'),
    });

    return { changeLogId, deliveryOptions };
  }

  private async getPendingLog(changeLogId: string) {
    const log = await this.prisma.deliveryChangeLog.findUnique({
      where: { id: changeLogId },
    });
    if (!log || log.status !== 'PENDING') {
      throw new NotFoundException('Pending delivery review not found');
    }
    return log;
  }

  private async assertCanManageDelivery(listingId: string, actorId: string, role: RbacRole) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { category: { select: { slug: true } } },
    });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);

    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (!isAdmin && listing.sellerId !== actorId) {
      throw new ForbiddenException('You can only update delivery for your own listings');
    }
    if (!isAdmin) {
      await this.sellerListingGate.assertSellerNotSuspended(actorId);
    }
    return listing;
  }

  private async validateSelections(selections: ListingDeliverySelectionInput[]) {
    if (selections.length === 0) {
      throw new BadRequestException('Select at least one delivery option');
    }

    const optionIds = [...new Set(selections.map((s) => s.deliveryOptionId))];
    const options = await this.catalog.findByIds(optionIds);
    if (options.length !== optionIds.length) {
      throw new BadRequestException('One or more delivery options are invalid or inactive');
    }

    const optionById = new Map(options.map((o) => [o.id, o]));
    const hasCollection = selections.some(
      (s) => optionById.get(s.deliveryOptionId)?.zone === 'COLLECTION',
    );
    if (hasCollection && selections.length > 1) {
      throw new BadRequestException('Collection Only cannot be combined with other delivery options');
    }

    for (const selection of selections) {
      const option = optionById.get(selection.deliveryOptionId)!;
      if (option.zone === 'CUSTOM') {
        if (!selection.customLabel?.trim()) {
          throw new BadRequestException('Custom delivery options require a label');
        }
        if (selection.customPrice == null || selection.customPrice < 0) {
          throw new BadRequestException('Custom delivery options require a valid price');
        }
      }
    }
  }

  private async resolveSelections(
    selections: ListingDeliverySelectionInput[],
  ): Promise<ListingDeliverySelection[]> {
    await this.validateSelections(selections);
    const options = await this.catalog.findByIds(selections.map((s) => s.deliveryOptionId));
    const optionById = new Map(options.map((o) => [o.id, o]));

    return selections.map((selection) => {
      const option = optionById.get(selection.deliveryOptionId)!;
      const price =
        selection.customPrice != null
          ? selection.customPrice
          : option.defaultPrice != null
            ? Number(option.defaultPrice)
            : undefined;

      return {
        deliveryOptionId: selection.deliveryOptionId,
        customLabel: selection.customLabel,
        customPrice: selection.customPrice,
        label: selection.customLabel ?? option.label,
        zone: option.zone,
        price,
      };
    });
  }

  private async replaceListingOptions(
    listingId: string,
    selections: ListingDeliverySelectionInput[] | ListingDeliverySelection[],
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.listingDeliveryOption.deleteMany({ where: { listingId } });
      if (selections.length === 0) return;
      await tx.listingDeliveryOption.createMany({
        data: selections.map((selection) => ({
          listingId,
          deliveryOptionId: selection.deliveryOptionId,
          customLabel: selection.customLabel ?? null,
          customPrice: selection.customPrice ?? null,
        })),
      });
    });
  }

  private async evaluateSoftReview(
    listing: {
      id: string;
      sellerId: string;
      status: string;
      category: { slug: string };
    },
    current: ListingDeliverySelection[],
    proposed: ListingDeliverySelection[],
  ): Promise<{ requiresReview: boolean; reasons: string[] }> {
    if (listing.status !== 'active') {
      return { requiresReview: false, reasons: [] };
    }

    const reasons: string[] = [];

    const maxFee = proposed.reduce((max, item) => Math.max(max, item.price ?? 0), 0);
    if (maxFee > MAX_AUTO_APPROVE_FEE) {
      reasons.push(`Delivery fee exceeds €${MAX_AUTO_APPROVE_FEE}`);
    }

    const hadNational = current.some((item) => item.zone === 'NATIONAL');
    const addsNational = proposed.some((item) => item.zone === 'NATIONAL');
    if (!hadNational && addsNational) {
      reasons.push('Nationwide delivery added for the first time');
    }

    const customCount = proposed.filter((item) => item.zone === 'CUSTOM').length;
    const prevCustomCount = current.filter((item) => item.zone === 'CUSTOM').length;
    if (customCount >= 3 && customCount - prevCustomCount >= 3) {
      reasons.push('Three or more custom delivery options added at once');
    }

    const wasCollectionOnly =
      current.length === 1 && current[0]?.zone === 'COLLECTION';
    const addsNationalFromCollection =
      wasCollectionOnly && proposed.some((item) => item.zone === 'NATIONAL');
    if (addsNationalFromCollection && HIGH_RISK_CATEGORY_SLUGS.has(listing.category.slug)) {
      reasons.push(
        `Switching from Collection Only to nationwide delivery on ${listing.category.slug} category`,
      );
    }

    const hasDisputes = await this.sellerHasDeliveryDisputes(listing.sellerId);
    if (hasDisputes) {
      reasons.push('Seller has prior delivery-related disputes');
    }

    if (await this.sellerHasRejectedDeliveryChanges(listing.sellerId)) {
      reasons.push('Seller has previous rejected delivery changes');
    }

    for (const item of proposed) {
      if (item.zone === 'CUSTOM' && (item.price ?? 0) > MAX_AUTO_APPROVE_FEE) {
        reasons.push(`Custom delivery "${item.label}" fee exceeds €${MAX_AUTO_APPROVE_FEE}`);
        break;
      }
    }

    return { requiresReview: reasons.length > 0, reasons };
  }

  private async sellerHasDeliveryDisputes(sellerId: string): Promise<boolean> {
    const count = await this.prisma.paymentDispute.count({
      where: {
        payment: { sellerId },
        status: { in: ['open', 'under_review', 'lost'] },
      },
    });
    return count > 0;
  }

  private async sellerHasRejectedDeliveryChanges(sellerId: string): Promise<boolean> {
    const count = await this.prisma.deliveryChangeLog.count({
      where: { sellerId, status: 'REJECTED' },
    });
    return count > 0;
  }
}
