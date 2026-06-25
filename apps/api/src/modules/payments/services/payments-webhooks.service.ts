import { Injectable, Logger } from '@nestjs/common';
import type Stripe from 'stripe';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { PaymentsAuditService } from './payments-audit.service';
import { PaymentCompletionService } from './payment-completion.service';
import { PaymentsDisputesService } from './payments-disputes.service';
import { PaymentsPayoutsService } from './payments-payouts.service';
import { StripeConnectService } from './stripe-connect.service';

@Injectable()
export class PaymentsWebhooksService {
  private readonly logger = new Logger(PaymentsWebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeConnect: StripeConnectService,
    private readonly completion: PaymentCompletionService,
    private readonly disputes: PaymentsDisputesService,
    private readonly payouts: PaymentsPayoutsService,
    private readonly audit: PaymentsAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async handleEvent(event: Stripe.Event) {
    const processed = await this.prisma.processedStripeEvent.findUnique({
      where: { stripeEventId: event.id },
    });
    if (processed) return { duplicate: true };

    await this.prisma.processedStripeEvent.create({
      data: { stripeEventId: event.id, eventType: event.type },
    });

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.onPaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.onPaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await this.onChargeRefunded(event.data.object as Stripe.Charge);
        break;
      case 'charge.dispute.created':
        await this.onDisputeCreated(event.data.object as Stripe.Dispute);
        break;
      case 'payout.paid':
        await this.onPayoutEvent(event.data.object as Stripe.Payout, 'paid');
        break;
      case 'payout.failed':
        await this.onPayoutEvent(event.data.object as Stripe.Payout, 'failed');
        break;
      case 'account.updated':
        await this.onAccountUpdated(event.data.object as Stripe.Account);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    return { duplicate: false };
  }

  private async onPaymentSucceeded(intent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId: intent.id },
    });
    if (!payment) return;

    await this.completion.finalizeSuccessfulPayment(payment.id, intent.id);
  }

  private async onPaymentFailed(intent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId: intent.id },
    });
    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'failed' },
    });

    await this.audit.record('payment_failed', undefined, payment.id);
    this.eventBus.publish({
      type: 'payment.failed',
      payload: { paymentId: payment.id, listingId: payment.listingId },
      timestamp: new Date(),
    });
  }

  private async onChargeRefunded(charge: Stripe.Charge) {
    const paymentIntentId =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id;
    if (!paymentIntentId) return;

    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId: paymentIntentId },
    });
    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'refunded',
        providerRefundId: charge.refunds?.data[0]?.id,
      },
    });

    await this.audit.record('payment_refunded', undefined, payment.id);
    this.eventBus.publish({
      type: 'payment.refunded',
      payload: { paymentId: payment.id, listingId: payment.listingId },
      timestamp: new Date(),
    });
  }

  private async onDisputeCreated(dispute: Stripe.Dispute) {
    const paymentIntentId =
      typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : dispute.payment_intent?.id;
    if (!paymentIntentId) return;

    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId: paymentIntentId },
    });
    if (!payment) return;

    await this.disputes.upsertFromWebhook(
      payment.id,
      dispute.id,
      dispute.reason ?? undefined,
    );
  }

  private async onPayoutEvent(payout: Stripe.Payout, status: 'paid' | 'failed') {
    const stripeAccountId =
      typeof payout.destination === 'string' ? payout.destination : undefined;
    if (!stripeAccountId) return;

    try {
      const sellerId = await this.payouts.resolveSellerByStripeAccount(stripeAccountId);
      await this.payouts.recordFromWebhook(
        sellerId,
        payout.id,
        payout.amount / 100,
        payout.currency.toUpperCase(),
        status,
      );
    } catch {
      this.logger.warn(`Payout event for unknown account: ${stripeAccountId}`);
    }
  }

  private async onAccountUpdated(account: Stripe.Account) {
    const row = await this.prisma.stripeConnectAccount.findUnique({
      where: { stripeAccountId: account.id },
    });
    if (!row) return;

    await this.stripeConnect.syncAccountFromStripe(row.userId, account.id);
  }
}
