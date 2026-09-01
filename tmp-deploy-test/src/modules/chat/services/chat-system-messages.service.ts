import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { ChatMessagesService } from './chat-messages.service';

@Injectable()
export class ChatSystemMessagesService implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly prisma: PrismaService,
    private readonly messages: ChatMessagesService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('listing.updated', (event) => {
      void this.onListingUpdated(event.payload);
    });
    this.eventBus.subscribe('user.verification_approved', (event) => {
      void this.onVerificationApproved(event.payload);
    });
    this.eventBus.subscribe('payment.created', (event) => {
      void this.onPaymentEvent(event.payload, 'Payment initiated');
    });
    this.eventBus.subscribe('payment.succeeded', (event) => {
      void this.onPaymentEvent(event.payload, 'Payment completed successfully');
    });
    this.eventBus.subscribe('payment.failed', (event) => {
      void this.onPaymentEvent(event.payload, 'Payment failed');
    });
  }

  private async onListingUpdated(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string | undefined;
    if (!listingId) return;

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { status: true, title: true },
    });
    if (!listing || listing.status !== 'sold') return;

    const threads = await this.prisma.chatThread.findMany({
      where: { listingId },
      select: { id: true, sellerId: true },
    });

    for (const thread of threads) {
      await this.messages.sendSystemMessage(
        thread.id,
        `Listing "${listing.title}" has been marked as sold.`,
        thread.sellerId,
      );
    }
  }

  private async onVerificationApproved(payload: Record<string, unknown>) {
    const userId = payload.userId as string | undefined;
    if (!userId) return;

    const threads = await this.prisma.chatThread.findMany({
      where: { sellerId: userId },
      select: { id: true, sellerId: true },
    });

    for (const thread of threads) {
      await this.messages.sendSystemMessage(
        thread.id,
        'Seller verification has been approved.',
        thread.sellerId,
      );
    }
  }

  private async onPaymentEvent(payload: Record<string, unknown>, label: string) {
    const listingId = payload.listingId as string | undefined;
    if (!listingId) return;

    const threads = await this.prisma.chatThread.findMany({
      where: { listingId },
      select: { id: true, sellerId: true },
    });

    for (const thread of threads) {
      await this.messages.sendSystemMessage(
        thread.id,
        `${label} for this listing.`,
        thread.sellerId,
      );
    }
  }
}
