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
    this.eventBus.subscribe('platform_purchase.succeeded', (e) =>
      void this.onPlatformPurchaseSucceeded(e.payload),
    );
    this.eventBus.subscribe('payment.failed', (e) => void this.onPaymentFailed(e.payload));
    this.eventBus.subscribe('payment.refunded', (e) => void this.onPaymentRefunded(e.payload));
    this.eventBus.subscribe('payment.refund_requested', (e) =>
      void this.onRefundRequested(e.payload),
    );
    this.eventBus.subscribe('payment.disputed', (e) => void this.onPaymentDisputed(e.payload));
    this.eventBus.subscribe('listing.created', (e) => void this.onListingCreated(e.payload));
    this.eventBus.subscribe('seller.verification_nudge', (e) =>
      void this.onSellerVerificationNudge(e.payload),
    );
    this.eventBus.subscribe('listing.submitted_for_review', (e) =>
      void this.onListingSubmittedForReview(e.payload),
    );
    this.eventBus.subscribe('listing.approved', (e) => void this.onListingApproved(e.payload));
    this.eventBus.subscribe('listing.changes_requested', (e) =>
      void this.onListingChangesRequested(e.payload),
    );
    this.eventBus.subscribe('listing.review_reply', (e) => void this.onListingReviewReply(e.payload));
    this.eventBus.subscribe('listing.updated', (e) => void this.onListingUpdated(e.payload));
    this.eventBus.subscribe('listing.sold', (e) => void this.onListingSold(e.payload));
    this.eventBus.subscribe('listing.rejected', (e) => void this.onListingRejected(e.payload));
    this.eventBus.subscribe('listing.expired', (e) => void this.onListingExpired(e.payload));
    this.eventBus.subscribe('listing.expiring_soon', (e) => void this.onListingExpiringSoon(e.payload));
    this.eventBus.subscribe('listing.removed', (e) => void this.onListingRemoved(e.payload));
    this.eventBus.subscribe('listing.moderation_queued', (e) =>
      void this.onListingModerationQueued(e.payload),
    );
    this.eventBus.subscribe('listing.under_investigation', (e) =>
      void this.onListingUnderInvestigation(e.payload),
    );
    this.eventBus.subscribe('listing.renewed', (e) => void this.onListingRenewed(e.payload));
    this.eventBus.subscribe('user.verification_approved', (e) =>
      void this.onVerificationApproved(e.payload),
    );
    this.eventBus.subscribe('user.verification_rejected', (e) =>
      void this.onVerificationRejected(e.payload),
    );
    this.eventBus.subscribe('seller.suspended', (e) => void this.onSellerSuspended(e.payload));
    this.eventBus.subscribe('seller.reactivated', (e) => void this.onSellerReactivated(e.payload));
    this.eventBus.subscribe('seller.force_reverify', (e) =>
      void this.onSellerForceReverify(e.payload),
    );
    this.eventBus.subscribe('seller.warned', (e) => void this.onSellerWarned(e.payload));
    this.eventBus.subscribe('admin.action', (e) => void this.onAdminAction(e.payload));
    this.eventBus.subscribe('moderation.report_created', (e) =>
      void this.onModerationReportCreated(e.payload),
    );
    this.eventBus.subscribe('moderation.user_warned', (e) =>
      void this.onModerationUserWarned(e.payload),
    );
    this.eventBus.subscribe('moderation.user_suspended', (e) =>
      void this.onModerationUserSuspended(e.payload),
    );
    this.eventBus.subscribe('moderation.user_banned', (e) =>
      void this.onModerationUserBanned(e.payload),
    );
    this.eventBus.subscribe('moderation.appeal_decided', (e) =>
      void this.onAppealDecided(e.payload),
    );
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
      select: { buyerId: true, sellerId: true, listingId: true },
    });
    if (!payment) return;

    await Promise.all([
      this.dispatcher.dispatch({
        userId: payment.buyerId,
        type: 'payment_sent',
        templateKey: 'payment_completed',
        variables: {
          title: 'Payment successful',
          message: 'Your purchase is confirmed. Your receipt is in Purchases and was emailed to you.',
        },
        actionUrl: '/buyer/purchases',
        channels: ['in_app', 'push'],
      }),
      this.dispatcher.dispatch({
        userId: payment.sellerId,
        type: 'payment_received',
        templateKey: 'payment_received',
        actionUrl: '/seller/earnings',
        channels: ['in_app', 'push'],
      }),
    ]);
  }

  private async onPlatformPurchaseSucceeded(payload: Record<string, unknown>) {
    const userId = payload.userId as string;
    const purchaseId = payload.purchaseId as string;
    if (!userId || !purchaseId) return;

    await this.dispatcher.dispatch({
      userId,
      type: 'payment_sent',
      templateKey: 'platform_purchase_completed',
      variables: {
        title: 'Payment confirmed',
        message:
          'Your platform payment was successful. Your invoice is in Earnings and was emailed to you.',
      },
      actionUrl: '/seller/earnings',
      channels: ['in_app', 'push'],
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

  private async onSellerVerificationNudge(payload: Record<string, unknown>) {
    const sellerId = payload.sellerId as string;
    const message = payload.message as string;
    if (!sellerId || !message) return;

    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'seller_verification_nudge',
      templateKey: 'seller_verification_nudge',
      variables: { message },
      actionUrl: '/seller/profile?tab=verification',
      channels: ['in_app', 'email'],
    });
  }

  private async onListingCreated(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true, sellerId: true, status: true },
    });
    if (!listing || listing.status !== 'active') return;

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

  private async notifyActiveStaffAdmins(input: {
    message: string;
    title: string;
    actionUrl: string;
    data?: Record<string, unknown>;
  }) {
    const admins = await this.prisma.user.findMany({
      where: {
        primaryRole: { code: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        status: 'active',
      },
      select: { id: true },
      take: 50,
    });

    await Promise.all(
      admins.map((admin) =>
        this.dispatcher.dispatch({
          userId: admin.id,
          type: 'system',
          templateKey: 'admin_warning',
          variables: {
            title: input.title,
            message: input.message,
          },
          actionUrl: input.actionUrl,
          data: input.data,
          channels: ['in_app'],
        }),
      ),
    );
  }

  private async onListingSubmittedForReview(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true },
    });
    if (!listing) return;

    await this.notifyActiveStaffAdmins({
      title: 'Listing pending review',
      message: `"${listing.title}" was submitted and needs approval.`,
      actionUrl: '/admin/listings',
      data: { listingId },
    });
  }

  private async onListingApproved(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const sellerId = payload.sellerId as string;
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true },
    });
    if (!listing) return;

    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'listing_approved',
      templateKey: 'listing_approved',
      variables: { listing_title: listing.title },
      actionUrl: `/listings/${listingId}`,
      channels: ['in_app', 'push'],
    });
  }

  private async onListingChangesRequested(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const sellerId = payload.sellerId as string;
    const message = (payload.message as string) ?? 'Please review the admin feedback.';
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true },
    });
    if (!listing || !sellerId) return;

    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'listing_changes_requested',
      templateKey: 'listing_changes_requested',
      variables: { listing_title: listing.title, message },
      actionUrl: `/seller/listings/${listingId}/edit`,
      channels: ['in_app', 'push', 'email'],
    });
  }

  private async onListingReviewReply(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const adminId = payload.adminId as string;
    const message = (payload.message as string) ?? 'The seller replied to your review feedback.';
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true },
    });
    if (!listing || !adminId) return;

    await this.dispatcher.dispatch({
      userId: adminId,
      type: 'listing_review_reply',
      templateKey: 'listing_review_reply',
      variables: { listing_title: listing.title, message },
      actionUrl: `/admin/listings`,
      channels: ['in_app', 'push'],
    });
  }

  private async onListingUpdated(_payload: Record<string, unknown>) {
    // Non-status listing updates — no notification by default
  }

  private async onListingSold(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const sellerId = payload.sellerId as string;
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true },
    });
    if (!listing || !sellerId) return;

    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'listing_sold',
      templateKey: 'listing_sold',
      variables: { listing_title: listing.title },
      channels: ['in_app', 'push', 'email'],
    });
  }

  private async onListingRejected(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const sellerId = payload.sellerId as string;
    const reason = (payload.reason as string) ?? 'Please review and resubmit.';
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true },
    });
    if (!listing || !sellerId) return;

    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'listing_rejected',
      templateKey: 'listing_rejected',
      variables: { listing_title: listing.title, reason },
      actionUrl: `/seller/listings/${listingId}/edit`,
      channels: ['in_app', 'push', 'email'],
    });
  }

  private async onListingModerationQueued(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const sellerId = payload.sellerId as string;
    const reason = (payload.reason as string) ?? 'Your listing requires admin review.';
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true },
    });
    if (!listing || !sellerId) return;

    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'listing_changes_requested',
      templateKey: 'listing_changes_requested',
      variables: { listing_title: listing.title, reason },
      actionUrl: `/seller/listings/${listingId}/edit`,
      channels: ['in_app', 'push', 'email'],
    });
  }

  private async onListingUnderInvestigation(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const sellerId = payload.sellerId as string;
    const reason = (payload.reason as string) ?? 'Your listing is under investigation.';
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true },
    });
    if (!listing || !sellerId) return;

    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'admin_warning',
      templateKey: 'admin_warning',
      variables: { listing_title: listing.title, reason },
      actionUrl: `/seller/listings/${listingId}/edit`,
      channels: ['in_app', 'email'],
    });
  }

  private async onListingExpired(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const sellerId = payload.sellerId as string;
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true },
    });
    if (!listing || !sellerId) return;

    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'listing_expired',
      templateKey: 'listing_expired',
      variables: { listing_title: listing.title },
      actionUrl: `/seller/listings/${listingId}/edit`,
      channels: ['in_app', 'push', 'email'],
    });
  }

  private async onListingExpiringSoon(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const sellerId = payload.sellerId as string;
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true, expiresAt: true },
    });
    if (!listing || !sellerId) return;

    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'listing_expiring_soon',
      templateKey: 'listing_expiring_soon',
      variables: {
        listing_title: listing.title,
        expires_at: listing.expiresAt?.toISOString() ?? '',
      },
      actionUrl: `/seller/listings/${listingId}/edit`,
      channels: ['in_app', 'email'],
    });
  }

  private async onListingRemoved(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const sellerId = payload.sellerId as string;
    const reason = (payload.reason as string) ?? 'Removed by an administrator.';
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true },
    });
    if (!listing || !sellerId) return;

    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'listing_removed',
      templateKey: 'listing_removed',
      variables: { listing_title: listing.title, reason },
      actionUrl: `/seller/listings`,
      channels: ['in_app', 'push', 'email'],
    });
  }

  private async onListingRenewed(payload: Record<string, unknown>) {
    const listingId = payload.listingId as string;
    const sellerId = payload.sellerId as string;
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true },
    });
    if (!listing || !sellerId) return;

    await this.dispatcher.dispatch({
      userId: sellerId,
      type: 'listing_renewed',
      templateKey: 'listing_renewed',
      variables: { listing_title: listing.title },
      actionUrl: `/listings/${listingId}`,
      channels: ['in_app', 'email'],
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

  private async onSellerSuspended(payload: Record<string, unknown>) {
    const userId = payload.userId as string;
    const reason = (payload.reason as string) ?? 'Policy violation';
    const duration = payload.duration as string | undefined;
    if (!userId) return;
    await this.dispatcher.dispatch({
      userId,
      type: 'admin_warning',
      templateKey: 'seller_suspended',
      variables: {
        reason,
        duration: duration ?? 'unspecified',
        message: (payload.message as string) ?? `Your seller account has been suspended. ${reason}`,
      },
      actionUrl: '/seller/profile?tab=verification',
      channels: ['in_app', 'email'],
    });
  }

  private async onSellerReactivated(payload: Record<string, unknown>) {
    const userId = payload.userId as string;
    if (!userId) return;
    await this.dispatcher.dispatch({
      userId,
      type: 'admin_warning',
      templateKey: 'seller_reactivated',
      variables: {
        message: (payload.message as string) ?? 'Your seller account has been reactivated.',
        reason: (payload.reason as string) ?? '',
      },
      actionUrl: '/seller/dashboard',
      channels: ['in_app', 'email'],
    });
  }

  private async onSellerForceReverify(payload: Record<string, unknown>) {
    const userId = payload.userId as string;
    if (!userId) return;
    await this.dispatcher.dispatch({
      userId,
      type: 'seller_verification_nudge',
      templateKey: 'seller_force_reverify',
      variables: {
        message:
          (payload.message as string) ?? 'Your account requires re-verification.',
        reason: (payload.reason as string) ?? '',
      },
      actionUrl: '/seller/profile?tab=verification',
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

  private async onModerationReportCreated(payload: Record<string, unknown>) {
    await this.notifyActiveStaffAdmins({
      title: 'New moderation report',
      message: `New moderation report received (${payload.targetType ?? 'unknown'}).`,
      actionUrl: '/admin/dashboard/moderation',
    });
  }

  private async onModerationUserWarned(payload: Record<string, unknown>) {
    const userId = payload.userId as string;
    const message = (payload.message as string) ?? 'You received a warning from moderation.';
    if (!userId) return;
    await this.dispatcher.dispatch({
      userId,
      type: 'admin_warning',
      templateKey: 'admin_warning',
      variables: { message },
      channels: ['in_app', 'push'],
    });
  }

  private async onModerationUserSuspended(payload: Record<string, unknown>) {
    const userId = payload.userId as string;
    const duration = (payload.duration as string) ?? 'temporary';
    if (!userId) return;
    await this.dispatcher.dispatch({
      userId,
      type: 'admin_warning',
      templateKey: 'admin_warning',
      variables: { message: `Your account has been suspended (${duration}).` },
      channels: ['in_app', 'push', 'email'],
    });
  }

  private async onModerationUserBanned(payload: Record<string, unknown>) {
    const userId = payload.userId as string;
    if (!userId) return;
    await this.dispatcher.dispatch({
      userId,
      type: 'admin_warning',
      templateKey: 'admin_warning',
      variables: { message: 'Your account has been permanently banned.' },
      channels: ['in_app', 'push', 'email'],
    });
  }

  private async onAppealDecided(payload: Record<string, unknown>) {
    const userId = payload.userId as string;
    const status = payload.status as string;
    const adminNotes = payload.adminNotes as string | undefined;
    if (!userId) return;
    await this.dispatcher.dispatch({
      userId,
      type: 'system',
      templateKey: 'admin_warning',
      variables: {
        message:
          status === 'approved'
            ? `Your appeal was approved.${adminNotes ? ` ${adminNotes}` : ''}`
            : `Your appeal was rejected.${adminNotes ? ` ${adminNotes}` : ''}`,
      },
      channels: ['in_app', 'push'],
    });
  }
}
