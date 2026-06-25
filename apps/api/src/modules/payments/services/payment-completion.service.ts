import { Injectable } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { ListingsService } from '../../listings/listings.service';
import { PaymentsAuditService } from './payments-audit.service';
import { PaymentsLedgerService } from './payments-ledger.service';

/**
 * Idempotent post-payment settlement: ledger entries, listing sold, events.
 * Used by Stripe webhooks and buyer confirm endpoint.
 */
@Injectable()
export class PaymentCompletionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: PaymentsLedgerService,
    private readonly audit: PaymentsAuditService,
    private readonly eventBus: EventBusService,
    private readonly listingsService: ListingsService,
  ) {}

  async finalizeSuccessfulPayment(paymentId: string, providerReference?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) return null;
    if (payment.status === 'succeeded') return payment;

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'succeeded' },
    });

    const netAmount = Number(payment.amount) - Number(payment.platformFee ?? 0);
    await this.ledger.record(
      payment.sellerId,
      'credit',
      netAmount,
      payment.currency,
      { paymentId: payment.id, referenceId: providerReference ?? payment.providerPaymentId ?? undefined },
    );
    await this.ledger.record(
      payment.buyerId,
      'debit',
      Number(payment.amount),
      payment.currency,
      { paymentId: payment.id, referenceId: providerReference ?? payment.providerPaymentId ?? undefined },
    );

    const listing = await this.prisma.listing.findUnique({
      where: { id: payment.listingId },
      select: { status: true },
    });
    if (listing?.status === 'active' || listing?.status === 'paused') {
      await this.listingsService.markSoldFromPayment(payment.listingId);
    }

    await this.audit.record('payment_succeeded', undefined, payment.id);
    this.eventBus.publish({
      type: 'payment.succeeded',
      payload: { paymentId: payment.id, listingId: payment.listingId },
      timestamp: new Date(),
    });

    return this.prisma.payment.findUnique({ where: { id: paymentId } });
  }
}
