import { Injectable } from '@nestjs/common';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { ListingsService } from '../../listings/listings.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { PaymentsAuditService } from './payments-audit.service';
import { PaymentsLedgerService } from './payments-ledger.service';
import { PaymentReceiptService } from './payment-receipt.service';

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
    private readonly receipts: PaymentReceiptService,
    private readonly logger: LoggerLib,
  ) {}

  async finalizeSuccessfulPayment(paymentId: string, providerReference?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) return null;

    const alreadySucceeded = payment.status === 'succeeded';

    if (!alreadySucceeded) {
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
      if (
        listing?.status === 'active' ||
        listing?.status === 'paused' ||
        listing?.status === 'reserved'
      ) {
        await this.listingsService.markSoldFromPayment(
          payment.listingId,
          payment.buyerId,
        );
      }

      await this.audit.record('payment_succeeded', undefined, payment.id);
      this.eventBus.publish({
        type: 'payment.succeeded',
        payload: { paymentId: payment.id, listingId: payment.listingId },
        timestamp: new Date(),
      });
    }

    void this.receipts.generateForPayment(payment.id).catch((error) => {
      this.logger.error(
        'PaymentCompletionService',
        `Failed to generate receipt for payment ${payment.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    });

    return this.prisma.payment.findUnique({ where: { id: paymentId } });
  }
}
