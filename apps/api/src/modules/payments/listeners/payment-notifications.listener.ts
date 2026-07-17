import { Injectable, OnModuleInit } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class PaymentNotificationsListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('payment.succeeded', (event) => {
      void this.onPaymentSucceeded(event.payload);
    });
    this.eventBus.subscribe('payment.failed', (event) => {
      void this.onPaymentFailed(event.payload);
    });
    this.eventBus.subscribe('payment.refund_requested', (event) => {
      void this.onRefundRequested(event.payload);
    });
    this.eventBus.subscribe('payment.disputed', (event) => {
      void this.onDisputed(event.payload);
    });
  }

  private async onPaymentSucceeded(payload: Record<string, unknown>) {
    const paymentId = payload.paymentId as string | undefined;
    if (!paymentId) return;

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: { sellerId: true },
    });
    if (!payment) return;

    await this.notifications.send({
      userId: payment.sellerId,
      type: 'payment_received',
      title: 'Payment received',
      body: 'A buyer completed payment for your listing.',
      actionUrl: '/account/earnings',
    });
  }

  private async onPaymentFailed(payload: Record<string, unknown>) {
    const paymentId = payload.paymentId as string | undefined;
    if (!paymentId) return;

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: { buyerId: true },
    });
    if (!payment) return;

    await this.notifications.send({
      userId: payment.buyerId,
      type: 'payment_sent',
      title: 'Payment failed',
      body: 'Your payment could not be processed. Please try again.',
      actionUrl: '/account/purchases',
    });
  }

  private async onRefundRequested(payload: Record<string, unknown>) {
    const sellerId = payload.sellerId as string | undefined;
    if (!sellerId) return;

    await this.notifications.send({
      userId: sellerId,
      type: 'system',
      title: 'Refund requested',
      body: 'A buyer requested a refund for a recent purchase.',
      actionUrl: '/account/earnings',
    });
  }

  private async onDisputed(payload: Record<string, unknown>) {
    const sellerId = payload.sellerId as string | undefined;
    if (!sellerId) return;

    await this.notifications.send({
      userId: sellerId,
      type: 'system',
      title: 'Payment disputed',
      body: 'A payment dispute was opened. Our team will review it.',
      actionUrl: '/account/earnings',
    });
  }
}
