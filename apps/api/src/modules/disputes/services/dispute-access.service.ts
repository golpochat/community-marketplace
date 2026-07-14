import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MarketplaceDisputeStatus } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';

const ACTIVE_STATUSES: MarketplaceDisputeStatus[] = [
  'open',
  'awaiting_evidence',
  'under_review',
];

@Injectable()
export class DisputeAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertBuyerOnListing(buyerId: string, listingId: string, paymentId?: string) {
    const payment = paymentId
      ? await this.prisma.payment.findFirst({
          where: {
            id: paymentId,
            buyerId,
            listingId,
            status: 'succeeded',
          },
        })
      : await this.prisma.payment.findFirst({
          where: { buyerId, listingId, status: 'succeeded' },
          orderBy: { createdAt: 'desc' },
        });

    if (!payment) {
      throw new BadRequestException(
        'You must have a successful payment for this listing before opening a dispute',
      );
    }

    const existing = await this.prisma.marketplaceDispute.findFirst({
      where: {
        buyerId,
        listingId,
        disputeStatus: { in: ACTIVE_STATUSES },
      },
    });

    if (existing) {
      throw new BadRequestException('An active dispute already exists for this listing');
    }

    return payment;
  }

  assertParticipant(dispute: { buyerId: string; sellerId: string }, userId: string) {
    if (dispute.buyerId !== userId && dispute.sellerId !== userId) {
      throw new ForbiddenException('You do not have access to this dispute');
    }
  }

  resolveParticipantSide(
    dispute: { buyerId: string; sellerId: string },
    userId: string,
  ): 'BUYER' | 'SELLER' {
    if (dispute.buyerId === userId) return 'BUYER';
    if (dispute.sellerId === userId) return 'SELLER';
    throw new ForbiddenException('You do not have access to this dispute');
  }

  assertBuyer(dispute: { buyerId: string }, userId: string) {
    if (dispute.buyerId !== userId) {
      throw new ForbiddenException('Only the buyer can perform this action');
    }
  }

  assertSeller(dispute: { sellerId: string }, userId: string) {
    if (dispute.sellerId !== userId) {
      throw new ForbiddenException('Only the seller can perform this action');
    }
  }

  assertCanAddEvidence(status: MarketplaceDisputeStatus) {
    if (!ACTIVE_STATUSES.includes(status)) {
      throw new BadRequestException('Evidence cannot be added to a closed dispute');
    }
  }

  async getDisputeOrThrow(disputeId: string) {
    const dispute = await this.prisma.marketplaceDispute.findUnique({
      where: { id: disputeId },
      include: {
        buyer: { select: { id: true, displayName: true } },
        seller: { select: { id: true, displayName: true } },
        listing: true,
        evidence: { orderBy: { createdAt: 'asc' } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, displayName: true } } },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return dispute;
  }
}
