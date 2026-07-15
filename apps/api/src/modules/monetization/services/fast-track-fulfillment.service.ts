import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { buildPrioritySlaFields } from '../lib/fast-track.lib';
import {
  FAST_TRACK_APPLY_METADATA_KEY,
  FAST_TRACK_REQUEUE_APPLIED_KEY,
  FAST_TRACK_REQUEUE_METADATA_KEY,
  readFastTrackPurchaseMetadata,
} from '../lib/fast-track-purchase.lib';

@Injectable()
export class FastTrackFulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async fulfillFastTrack(purchaseId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) return false;
    if (purchase.status === 'succeeded' && purchase.fulfilledAt) {
      return true;
    }

    const now = new Date();
    let priorityActivated: {
      userId: string;
      verificationId: string;
      reviewDueAt: string;
    } | null = null;

    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.platformPurchase.findUnique({ where: { id: purchaseId } });
      if (!current || (current.status === 'succeeded' && current.fulfilledAt)) {
        return true;
      }

      const pendingRequest = await tx.sellerVerificationRequest.findFirst({
        where: {
          userId: purchase.userId,
          status: 'pending',
        },
        orderBy: { createdAt: 'desc' },
      });

      const metadata = readFastTrackPurchaseMetadata(current.metadata);
      let applied = false;

      if (pendingRequest) {
        const wasPriority = pendingRequest.priority;
        if (!wasPriority) {
          const user = await tx.user.findUnique({
            where: { id: purchase.userId },
            select: { verificationRequestedAt: true },
          });
          const slaAnchor = user?.verificationRequestedAt ?? now;
          const slaFields = buildPrioritySlaFields(now, slaAnchor);
          await tx.sellerVerificationRequest.update({
            where: { id: pendingRequest.id },
            data: slaFields,
          });
          applied = true;

          if (user?.verificationRequestedAt) {
            priorityActivated = {
              userId: purchase.userId,
              verificationId: pendingRequest.id,
              reviewDueAt: slaFields.slaDueAt!.toISOString(),
            };
          }
        }
      } else {
        metadata[FAST_TRACK_APPLY_METADATA_KEY] = true;
        metadata.applied = false;
      }

      await tx.platformPurchase.update({
        where: { id: purchaseId },
        data: {
          status: 'succeeded',
          fulfilledAt: now,
          metadata: {
            ...metadata,
            ...(applied ? { applied: true, [FAST_TRACK_APPLY_METADATA_KEY]: false } : {}),
          },
        },
      });

      return true;
    });

    if (priorityActivated) {
      this.eventBus.publish({
        type: 'seller.verification_priority_activated',
        payload: priorityActivated,
        timestamp: now,
      });
    }

    return result;
  }

  async applyPendingFastTrackOnSubmit(userId: string, requestId: string): Promise<boolean> {
    const purchase = await this.findApplicableFastTrackPurchase(userId);
    if (!purchase) return false;

    const metadata = readFastTrackPurchaseMetadata(purchase.metadata);
    const applyOnSubmit = metadata[FAST_TRACK_APPLY_METADATA_KEY] === true;
    const requeuePending =
      metadata[FAST_TRACK_REQUEUE_METADATA_KEY] === true &&
      metadata[FAST_TRACK_REQUEUE_APPLIED_KEY] !== true;

    if (metadata.applied === true && !requeuePending) return false;
    if (!applyOnSubmit && !requeuePending) return false;

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.sellerVerificationRequest.update({
        where: { id: requestId },
        data: buildPrioritySlaFields(now, now),
      });
      await tx.platformPurchase.update({
        where: { id: purchase.id },
        data: {
          metadata: {
            ...metadata,
            applied: true,
            [FAST_TRACK_APPLY_METADATA_KEY]: false,
            ...(requeuePending ? { [FAST_TRACK_REQUEUE_APPLIED_KEY]: true } : {}),
          },
        },
      });
    });

    return true;
  }

  /** One-time priority re-queue after admin rejects a paid fast-track case. */
  async grantPriorityRequeue(userId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findFirst({
      where: {
        userId,
        type: 'fast_track_verification',
        status: 'succeeded',
      },
      orderBy: { fulfilledAt: 'desc' },
    });
    if (!purchase) return false;

    const metadata = readFastTrackPurchaseMetadata(purchase.metadata);
    if (metadata[FAST_TRACK_REQUEUE_METADATA_KEY] === true) {
      return false;
    }

    await this.prisma.platformPurchase.update({
      where: { id: purchase.id },
      data: {
        metadata: {
          ...metadata,
          [FAST_TRACK_REQUEUE_METADATA_KEY]: true,
          [FAST_TRACK_REQUEUE_APPLIED_KEY]: false,
        },
      },
    });

    return true;
  }

  private findApplicableFastTrackPurchase(userId: string) {
    return this.prisma.platformPurchase.findFirst({
      where: {
        userId,
        type: 'fast_track_verification',
        status: 'succeeded',
      },
      orderBy: { fulfilledAt: 'desc' },
    });
  }

  readMetadata(value: unknown): Record<string, unknown> {
    return readFastTrackPurchaseMetadata(value);
  }
}

export const FAST_TRACK_COOLDOWN_DAYS = 90;
