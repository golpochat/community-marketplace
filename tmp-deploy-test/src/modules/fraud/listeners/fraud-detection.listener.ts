import { Injectable, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { FraudDetectionService } from '../services/fraud-detection.service';

@Injectable()
export class FraudDetectionListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly fraud: FraudDetectionService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('listing.created', (event) => {
      const { listingId, sellerId } = event.payload as {
        listingId: string;
        sellerId: string;
      };
      void this.fraud.onListingCreated(listingId, sellerId);
    });

    this.eventBus.subscribe('chat.message_sent', (event) => {
      const { messageId, senderId } = event.payload as {
        messageId: string;
        senderId: string;
      };
      void this.fraud.onMessageSent(senderId, messageId);
    });

    this.eventBus.subscribe('chat.message_flagged', (event) => {
      const { senderId, messageId, reason } = event.payload as {
        senderId: string;
        messageId: string;
        reason: string;
      };
      void this.fraud.onMessageFlagged(senderId, messageId, reason);
    });

    this.eventBus.subscribe('user.activated', (event) => {
      const { userId, deviceFingerprint } = event.payload as {
        userId: string;
        deviceFingerprint?: string;
      };
      void this.fraud.onAccountCreated(userId, deviceFingerprint);
    });

    this.eventBus.subscribe('user.verification_requested', (event) => {
      const { userId } = event.payload as { userId: string };
      void this.fraud.onVerificationSubmitted(userId);
    });

    this.eventBus.subscribe('moderation.report_created', (event) => {
      const payload = event.payload as {
        listingId?: string;
        targetType: string;
        reasons?: string[];
      };
      if (payload.targetType !== 'listing' || !payload.listingId) return;
      void this.handleListingReport(payload.listingId, payload.reasons ?? ['buyer_report']);
    });

    this.eventBus.subscribe('listing.reported', (event) => {
      const { listingId } = event.payload as { listingId: string };
      void this.handleListingReport(listingId, ['buyer_report']);
    });
  }

  private async handleListingReport(listingId: string, reasons: string[]) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    });
    if (!listing) return;
    await this.fraud.onBuyerReport(listing.sellerId, listingId, reasons);
  }
}
