import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

const FAST_TRACK_APPLY_METADATA_KEY = 'applyOnSubmit';

@Injectable()
export class FastTrackFulfillmentService {
  constructor(private readonly prisma: PrismaService) {}

  async fulfillFastTrack(purchaseId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) return false;
    if (purchase.status === 'succeeded' && purchase.fulfilledAt) {
      return true;
    }

    const now = new Date();

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

      const metadata = this.readMetadata(current.metadata);
      let applied = false;

      if (pendingRequest) {
        await tx.sellerVerificationRequest.update({
          where: { id: pendingRequest.id },
          data: { priority: true },
        });
        applied = true;
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

    return result;
  }

  async applyPendingFastTrackOnSubmit(userId: string, requestId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findFirst({
      where: {
        userId,
        type: 'fast_track_verification',
        status: 'succeeded',
      },
      orderBy: { fulfilledAt: 'desc' },
    });
    if (!purchase) return false;

    const metadata = this.readMetadata(purchase.metadata);
    if (metadata.applied === true) return false;
    if (metadata[FAST_TRACK_APPLY_METADATA_KEY] !== true) return false;

    await this.prisma.$transaction(async (tx) => {
      await tx.sellerVerificationRequest.update({
        where: { id: requestId },
        data: { priority: true },
      });
      await tx.platformPurchase.update({
        where: { id: purchase.id },
        data: {
          metadata: {
            ...metadata,
            applied: true,
            [FAST_TRACK_APPLY_METADATA_KEY]: false,
          },
        },
      });
    });

    return true;
  }

  readMetadata(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return { ...(value as Record<string, unknown>) };
  }
}

export const FAST_TRACK_COOLDOWN_DAYS = 90;
