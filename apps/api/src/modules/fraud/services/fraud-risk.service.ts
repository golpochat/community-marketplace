import { Injectable } from '@nestjs/common';
import type { ListingStatus } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { NotificationDispatcherService } from '../../notifications/services/notification-dispatcher.service';
import { SellerStatusHistoryService } from '../../seller/services/seller-status-history.service';
import { FraudSignalsService } from './fraud-signals.service';

@Injectable()
export class FraudRiskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly signals: FraudSignalsService,
    private readonly eventBus: EventBusService,
    private readonly notifications: NotificationDispatcherService,
    private readonly statusHistory: SellerStatusHistoryService,
  ) {}

  async applyAutomatedActions(userId: string, listingId?: string): Promise<void> {
    const userRisk = await this.signals.computeUserRiskScore(userId);
    const listingRisk = listingId
      ? await this.signals.computeListingRiskScore(listingId)
      : 0;

    const effectiveListingRisk = Math.max(userRisk, listingRisk);

    if (effectiveListingRisk >= 50 && listingId) {
      await this.flagListing(listingId, `Fraud risk score ${effectiveListingRisk}`);
    }

    if (userRisk >= 80) {
      await this.escalateSellerReview(userId, userRisk);
      await this.notifyAdminsOfCriticalRisk(userId, userRisk, listingId);
    }
  }

  private async flagListing(listingId: string, reason: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true, sellerId: true },
    });
    if (!listing) return;

    const terminal: ListingStatus[] = ['sold', 'ended', 'removed'];
    if (terminal.includes(listing.status as ListingStatus)) return;
    if (listing.status === 'flagged') return;

    const fromStatus = listing.status as ListingStatus;

    await this.prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id: listingId },
        data: {
          status: 'flagged',
          moderationNotes: reason,
          moderationHiddenAt: new Date(),
          requiresFraudReview: true,
        },
      });

      await tx.listingStatusChangeLog.create({
        data: {
          listingId,
          fromStatus,
          toStatus: 'flagged',
          changedByType: 'SYSTEM',
          reason,
        },
      });
    });

    this.eventBus.publish({
      type: 'listing.moderation_queued',
      payload: {
        listingId,
        sellerId: listing.sellerId,
        fromStatus,
        toStatus: 'flagged',
        reason,
      },
      timestamp: new Date(),
    });
  }

  private async escalateSellerReview(userId: string, riskScore: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { sellerStatus: true },
    });
    if (!user || user.sellerStatus === 'suspended') return;
    if (user.sellerStatus === 'under_review') return;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { sellerStatus: 'under_review' },
      });

      await this.statusHistory.logChange(
        {
          userId,
          oldStatus: user.sellerStatus,
          newStatus: 'under_review',
          changedBy: null,
          reason: `Automated fraud review — risk score ${riskScore}`,
        },
        tx,
      );
    });

    this.eventBus.publish({
      type: 'fraud.critical_risk',
      payload: { userId, riskScore },
      timestamp: new Date(),
    });
  }

  private async notifyAdminsOfCriticalRisk(
    userId: string,
    riskScore: number,
    listingId?: string,
  ) {
    const admins = await this.prisma.user.findMany({
      where: {
        primaryRole: { code: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        status: 'active',
      },
      select: { id: true },
      take: 20,
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, email: true },
    });

    const label = user?.displayName ?? user?.email ?? userId;

    await Promise.all(
      admins.map((admin) =>
        this.notifications.dispatch({
          userId: admin.id,
          type: 'admin_warning',
          templateKey: 'admin_warning',
          variables: {
            message: `Critical fraud risk (${riskScore}) detected for ${label}${listingId ? ` on listing ${listingId}` : ''}.`,
          },
          actionUrl: '/admin/fraud',
          data: { userId, listingId, riskScore },
        }),
      ),
    );
  }
}
