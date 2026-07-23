import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  ListingTitleState,
  RbacRole,
  TitleUpdateResult,
} from '@community-marketplace/types';
import { listingEditActionUrl } from '@community-marketplace/types';
import { updateListingTitleSchema } from '@community-marketplace/validation';
import {
  isListingTitleAmendment,
  listingTitleSimilarity,
  normalizeListingTitle,
} from '@community-marketplace/utils';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { SellerListingGateService } from '../../seller/services/seller-listing-gate.service';
import { mapTitleChangeLog } from '../mappers/title.mapper';
import { ListingKeywordFilterService } from './listing-keyword-filter.service';

const AMENDABLE_STATUSES = new Set(['active', 'paused']);

@Injectable()
export class ListingTitleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly notifications: NotificationsService,
    private readonly sellerListingGate: SellerListingGateService,
    private readonly keywordFilters: ListingKeywordFilterService,
  ) {}

  async getSellerTitleState(
    listingId: string,
    sellerId: string,
    role: RbacRole,
  ): Promise<ListingTitleState> {
    const listing = await this.assertCanManageTitle(listingId, sellerId, role);
    const titleAmendRequired = this.requiresTitleAmend(listing);

    const pendingLog = await this.prisma.titleChangeLog.findFirst({
      where: { listingId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingLog) {
      return {
        liveTitle: listing.title,
        pendingTitle: pendingLog.newTitle,
        titleReviewStatus: 'pending-review',
        pendingChangeLogId: pendingLog.id,
        titleAmendRequired,
        similarityScore: pendingLog.similarityScore,
      };
    }

    const latestLog = await this.prisma.titleChangeLog.findFirst({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
    });

    if (latestLog?.status === 'REJECTED') {
      return {
        liveTitle: listing.title,
        pendingTitle: latestLog.newTitle,
        titleReviewStatus: 'rejected',
        pendingChangeLogId: latestLog.id,
        reviewNotes: latestLog.reviewNotes ?? undefined,
        titleAmendRequired,
        similarityScore: latestLog.similarityScore,
      };
    }

    return {
      liveTitle: listing.title,
      titleReviewStatus: 'none',
      titleAmendRequired,
    };
  }

  async updateTitle(
    listingId: string,
    sellerId: string,
    role: RbacRole,
    input: unknown,
  ): Promise<TitleUpdateResult> {
    const listing = await this.assertCanManageTitle(listingId, sellerId, role);
    const parsed = updateListingTitleSchema.parse(input);
    const proposed = normalizeListingTitle(parsed.title);
    const liveTitle = listing.title;

    await this.keywordFilters.assertNotHardBlocked(proposed, listing.description);

    if (normalizeListingTitle(liveTitle) === proposed) {
      return { status: 'unchanged', liveTitle };
    }

    if (!this.requiresTitleAmend(listing)) {
      await this.applyTitle(listingId, proposed);
      return { status: 'unchanged', liveTitle: proposed };
    }

    const similarity = listingTitleSimilarity(liveTitle, proposed);
    if (!isListingTitleAmendment(liveTitle, proposed)) {
      throw new BadRequestException({
        message:
          'That title looks like a different listing. Amend the existing title, or create a new listing instead.',
        code: 'TITLE_REWRITE_REJECTED',
        similarityScore: similarity,
      });
    }

    const existingPending = await this.prisma.titleChangeLog.findFirst({
      where: { listingId, status: 'PENDING' },
    });
    if (existingPending) {
      throw new BadRequestException(
        'A title change is already pending review. Wait for an admin decision before submitting again.',
      );
    }

    const changeLog = await this.prisma.titleChangeLog.create({
      data: {
        listingId,
        sellerId: listing.sellerId,
        oldTitle: liveTitle,
        newTitle: proposed,
        similarityScore: similarity,
        requiresReview: true,
        status: 'PENDING',
      },
    });

    await this.notifications.send({
      userId: listing.sellerId,
      type: 'title_review_pending',
      title: 'Title change pending review',
      body: 'Your proposed title is under review. Buyers still see your current title.',
      actionUrl: listingEditActionUrl(listingId, 'details'),
    });

    this.eventBus.publish({
      type: 'listing.title_change_pending',
      payload: { listingId, sellerId: listing.sellerId, changeLogId: changeLog.id },
      timestamp: new Date(),
    });

    return {
      status: 'pending-review',
      liveTitle,
      pendingTitle: proposed,
      changeLogId: changeLog.id,
      similarityScore: similarity,
      message:
        'Title amendment submitted for admin review. Buyers still see your current title.',
    };
  }

  async listPendingReviews(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { status: 'PENDING' as const, requiresReview: true };
    const [rows, total] = await Promise.all([
      this.prisma.titleChangeLog.findMany({
        where,
        include: {
          listing: { select: { id: true, title: true, status: true } },
          seller: { select: { id: true, displayName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.titleChangeLog.count({ where }),
    ]);

    return {
      data: rows.map(mapTitleChangeLog),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async approveChange(changeLogId: string, adminId: string, reviewNotes?: string) {
    const log = await this.getPendingLog(changeLogId);
    await this.applyTitle(log.listingId, log.newTitle);
    await this.prisma.titleChangeLog.update({
      where: { id: changeLogId },
      data: {
        status: 'APPROVED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes ?? null,
      },
    });

    await this.notifications.send({
      userId: log.sellerId,
      type: 'title_change_approved',
      title: 'Title change approved',
      body: 'Your updated title is now visible to buyers.',
      actionUrl: listingEditActionUrl(log.listingId, 'details'),
    });

    this.eventBus.publish({
      type: 'listing.title_change_approved',
      payload: { listingId: log.listingId, changeLogId, auto: false },
      timestamp: new Date(),
    });

    return { changeLogId, title: log.newTitle };
  }

  async rejectChange(changeLogId: string, adminId: string, reviewNotes?: string) {
    const log = await this.getPendingLog(changeLogId);
    await this.prisma.titleChangeLog.update({
      where: { id: changeLogId },
      data: {
        status: 'REJECTED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes ?? null,
      },
    });

    await this.notifications.send({
      userId: log.sellerId,
      type: 'title_change_rejected',
      title: 'Title change rejected',
      body:
        reviewNotes?.trim() ||
        'Your proposed title was not approved. The previous title remains live.',
      actionUrl: listingEditActionUrl(log.listingId, 'details'),
    });

    return { changeLogId, title: log.oldTitle };
  }

  private requiresTitleAmend(listing: {
    activatedAt: Date | null;
    status: string;
  }): boolean {
    return listing.activatedAt != null && AMENDABLE_STATUSES.has(listing.status);
  }

  private async getPendingLog(changeLogId: string) {
    const log = await this.prisma.titleChangeLog.findUnique({
      where: { id: changeLogId },
    });
    if (!log || log.status !== 'PENDING') {
      throw new NotFoundException('Pending title review not found');
    }
    return log;
  }

  private async applyTitle(listingId: string, title: string) {
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { title },
    });
  }

  private async assertCanManageTitle(listingId: string, actorId: string, role: RbacRole) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);

    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (!isAdmin && listing.sellerId !== actorId) {
      throw new ForbiddenException('You can only update titles for your own listings');
    }
    if (!isAdmin) {
      await this.sellerListingGate.assertSellerNotSuspended(actorId);
    }
    return listing;
  }
}
