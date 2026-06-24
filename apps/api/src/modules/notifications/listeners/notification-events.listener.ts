import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationDispatcherService } from '../services/notification-dispatcher.service';

@Injectable()
export class NotificationEventsListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly prisma: PrismaService,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('chat.message_sent', (e) => void this.onMessageSent(e.payload));
    this.eventBus.subscribe('chat.thread_created', (e) => void this.onThreadCreated(e.payload));
    this.eventBus.subscribe('chat.messages_read', (e) => void this.onMessagesRead(e.payload));
    this.eventBus.subscribe('payment.succeeded', (e) => void this.onPaymentSucceeded(e.payload));
    this.eventBus.subscribe('payment.failed', (e) => void this.onPaymentFailed(e.payload));
    this.eventBus.subscribe('payment.refunded', (e) => void this.onPaymentRefunded(e.payload));
    this.eventBus.subscribe('payment.refund_requested', (e) =>
      void this.onRefundRequested(e.payload),
    );
    this.eventBus.subscribe('payment.disputed', (e) => void this.onPaymentDisputed(e.payload));
    this.eventBus.subscribe('listing.created', (e) => void this.onListingCreated(e.payload));
    this.eventBus.subscribe('listing.updated', (e) => void this.onListingSold(e.payload));
    this.eventBus.subscribe('user.verification_approved', (e) =>
      void this.onVerificationApproved(e.payload),
    );
    this.eventBus.subscribe('user.verification_rejected', (e) =>
      void this.onVerificationRejected(e.payload),
    );
    this.eventBus.subscribe('seller.warned', (e) => void this.onSellerWarned(e.payload));
    this.eventBus.subscribe('admin.action', (e) => void this.onAdminAction(e.payload));
  }

  private async onMessageSent(payload: Record<string, unknown>) {
    const recipientId = payload.recipientId as string;
    const senderId = payload.senderId as string;
    const threadId = payload.threadId as string;
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { displayName: true, email: true },
    });

    await this.dispatcher.dispatch({
      userId: recipientId,
      type: 'new_message',
      templateKey: 'new_message',
      variables: { sender_name: sender?.displayName ?? sender?.email ?? 'Someone' },
      actionUrl: `/chat?thread=${threadId}`,
      channels: ['in_app', 'push'],
    });
  }

  private async onThreadCreated(payload: Record<string, unknown>) {
    const sellerId = payload.sellerId as string;
    const threadId = payload.threadId as string;
    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'thread_created',
      templateKey: 'new_message',
      variables: { sender_name: 'A buyer' },
      actionUrl: `/chat?thread=${threadId}`,
      channels: ['in_app', 'push'],
    });
  }

  private async onMessagesRead(payload: Record<string, unknown>) {
    const threadId = payload.threadId as string;
    const readerId = payload.readerId as string;
    const thread = await this.prisma.chatThread.findUnique({ where: { id: threadId } });
    if (!thread) return;
    const notifyUserId = thread.buyerId === readerId ? thread.sellerId : thread.buyerId;

    await this.dispatcher.dispatch({
      userId: notifyUserId,
      type: 'message_read',
      templateKey: 'new_message',
      variables: { sender_name: 'Recipient' },
      actionUrl: `/chat?thread=${threadId}`,
      channels: ['in_app'],
    });
  }

  private async onPaymentSucceeded(payload: Record<string, unknown>) {
    const paymentId = payload.paymentId as string;
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: { sellerId: true, listingId: true },
    });
    if (!payment) return;

    await this.dispatcher.dispatch({
      userId: payment.sellerId,
      type: 'payment_received',
      templateKey: 'payment_received',
      actionUrl: '/seller/earnings',
      channels: ['in_app', 'push', 'email'],
    });
  }

  private async onPaymentFailed(payload: Record<string, unknown>) {
    const paymentId = payload.paymentId as string;
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: { buyerId: true },
    });
    if (!payment) return;

    await this.dispatcher.dispatch({
      userId: payment.buyerId,
      type: 'payment_sent',
      templateKey: 'payment_failed',
      actionUrl: '/buyer/payments',
      channels: ['in_app', 'push'],
    });
  }

  private async onPaymentRefunded(payload: Record<string, unknown>) {
    const paymentId = payload.paymentId as string;
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: { buyerId: true, sellerId: true },
    });
    if (!payment) return;

    await Promise.all([
      this.dispatcher.dispatch({
        userId: payment.buyerId,
        type: 'payment_refunded',
        templateKey: 'payment_failed',
        variables: { title: 'Refund processed', message: 'Your refund has been processed.' },
        channels: ['in_app'],
      }),
      this.dispatcher.dispatch({
        userId: payment.sellerId,
        type: 'payment_refunded',
        templateKey: 'refund_requested',
        channels: ['in_app'],
      }),
    ]);
  }

  private async onRefundRequested(payload: Record<string, unknown>) {
    const sellerId = payload.sellerId as string;
    if (!sellerId) return;
    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'system',
      templateKey: 'refund_requested',
      channels: ['in_app', 'push'],
    });
  }

  private async onPaymentDisputed(payload: Record<string, unknown>) {
    const sellerId = payload.sellerId as string;
    if (!sellerId) return;
    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'system',
      templateKey: 'payment_disputed',
      channels: ['in_app', 'push'],
    });
  }

  private async onListingCreated(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true, sellerId: true },
    });
    if (!listing) return;

    const followers = await this.prisma.listingFavorite.findMany({
      where: { listingId },
      select: { userId: true },
      take: 50,
    });

    for (const fav of followers) {
      if (fav.userId === listing.sellerId) continue;
      await this.dispatcher.dispatch({
        userId: fav.userId,
        type: 'listing_created',
        templateKey: 'listing_created',
        variables: { listing_title: listing.title },
        actionUrl: `/listings/${listingId}`,
        channels: ['in_app'],
      });
    }
  }

  private async onListingSold(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true, sellerId: true, status: true },
    });
    if (!listing || listing.status !== 'sold') return;

    await this.dispatcher.dispatch({
      userId: listing.sellerId,
      type: 'listing_sold',
      templateKey: 'listing_sold',
      variables: { listing_title: listing.title },
      channels: ['in_app', 'push'],
    });
  }

  private async onVerificationApproved(payload: Record<string, unknown>) {
    const userId = payload.userId as string;
    if (!userId) return;
    await this.dispatcher.dispatch({
      userId,
      type: 'verification_approved',
      templateKey: 'verification_approved',
      channels: ['in_app', 'push', 'email'],
    });
  }

  private async onVerificationRejected(payload: Record<string, unknown>) {
    const userId = payload.userId as string;
    const reason = (payload.reason as string) ?? 'Please resubmit your documents.';
    if (!userId) return;
    await this.dispatcher.dispatch({
      userId,
      type: 'verification_rejected',
      templateKey: 'verification_rejected',
      variables: { reason },
      channels: ['in_app', 'email'],
    });
  }

  private async onSellerWarned(payload: Record<string, unknown>) {
    const sellerId = payload.sellerId as string;
    const message = (payload.message as string) ?? 'You received a warning from moderation.';
    if (!sellerId) return;
    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'admin_warning',
      templateKey: 'admin_warning',
      variables: { message },
      channels: ['in_app', 'push'],
    });
  }

  private async onAdminAction(payload: Record<string, unknown>) {
    const userId = payload.targetUserId as string;
    const message = (payload.message as string) ?? 'An admin action was taken on your account.';
    if (!userId) return;
    await this.dispatcher.dispatch({
      userId,
      type: 'admin_warning',
      templateKey: 'admin_warning',
      variables: { message },
      channels: ['in_app'],
    });
  }
}
