import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { PaymentRefund } from '@community-marketplace/types';
import type {
  ApproveRefundInput,
  RequestRefundInput,
} from '@community-marketplace/validation';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { mapRefund } from '../mappers/payment.mapper';
import { PaymentsAuditService } from './payments-audit.service';
import { PaymentsLedgerService } from './payments-ledger.service';
import { StripeConnectService } from './stripe-connect.service';

@Injectable()
export class PaymentsRefundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeConnect: StripeConnectService,
    private readonly ledger: PaymentsLedgerService,
    private readonly audit: PaymentsAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async requestRefund(
    buyerId: string,
    dto: RequestRefundInput,
  ): Promise<PaymentRefund> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.buyerId !== buyerId) {
      throw new ForbiddenException('Only the buyer can request a refund');
    }
    if (payment.status !== 'succeeded') {
      throw new BadRequestException('Only succeeded payments can be refunded');
    }

    const existing = await this.prisma.paymentRefund.findFirst({
      where: {
        paymentId: payment.id,
        status: { in: ['pending', 'approved', 'processed'] },
      },
    });
    if (existing) {
      throw new BadRequestException('A refund request already exists for this payment');
    }

    const row = await this.prisma.paymentRefund.create({
      data: {
        paymentId: payment.id,
        requestedById: buyerId,
        amount: payment.amount,
        reason: dto.reason,
        status: 'pending',
      },
    });

    await this.audit.record('refund_requested', buyerId, payment.id, {
      refundId: row.id,
    });

    this.eventBus.publish({
      type: 'payment.refund_requested',
      payload: { refundId: row.id, paymentId: payment.id, sellerId: payment.sellerId },
      timestamp: new Date(),
    });

    return mapRefund(row);
  }

  async approveRefund(
    adminId: string,
    dto: ApproveRefundInput,
  ): Promise<PaymentRefund> {
    const refund = await this.prisma.paymentRefund.findUnique({
      where: { id: dto.refundId },
      include: { payment: true },
    });
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status !== 'pending') {
      throw new BadRequestException('Refund is not pending approval');
    }

    if (!dto.approve) {
      const rejected = await this.prisma.paymentRefund.update({
        where: { id: refund.id },
        data: { status: 'rejected', approvedById: adminId },
      });
      await this.audit.record('refund_rejected', adminId, refund.paymentId, {
        reason: dto.reason,
      });
      return mapRefund(rejected);
    }

    const stripe = this.stripeConnect.getStripeClient();
    let providerRefundId: string | undefined;

    if (stripe && refund.payment.providerPaymentId) {
      const intent = await stripe.paymentIntents.retrieve(refund.payment.providerPaymentId);
      const transferId = intent.metadata?.transfer_id;
      if (transferId) {
        await stripe.transfers.createReversal(transferId);
      }

      const stripeRefund = await stripe.refunds.create({
        payment_intent: refund.payment.providerPaymentId,
      });
      providerRefundId = stripeRefund.id;
    } else {
      providerRefundId = `re_dev_${Date.now()}`;
    }

    const [updatedRefund] = await this.prisma.$transaction([
      this.prisma.paymentRefund.update({
        where: { id: refund.id },
        data: {
          status: 'processed',
          approvedById: adminId,
          providerRefundId,
        },
      }),
      this.prisma.payment.update({
        where: { id: refund.paymentId },
        data: {
          status: 'refunded',
          providerRefundId,
        },
      }),
    ]);

    await this.ledger.record(
      refund.payment.sellerId,
      'debit',
      Number(refund.amount),
      refund.payment.currency,
      { paymentId: refund.paymentId, referenceId: providerRefundId, metadata: { type: 'refund' } },
    );
    await this.ledger.record(
      refund.payment.buyerId,
      'credit',
      Number(refund.amount),
      refund.payment.currency,
      { paymentId: refund.paymentId, referenceId: providerRefundId, metadata: { type: 'refund' } },
    );

    await this.audit.record('refund_approved', adminId, refund.paymentId, {
      refundId: refund.id,
      providerRefundId,
    });

    this.eventBus.publish({
      type: 'payment.refunded',
      payload: { paymentId: refund.paymentId, listingId: refund.payment.listingId },
      timestamp: new Date(),
    });

    return mapRefund(updatedRefund);
  }

  async listPending(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { status: 'pending' as const };
    const [rows, total] = await Promise.all([
      this.prisma.paymentRefund.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.paymentRefund.count({ where }),
    ]);

    return {
      data: rows.map(mapRefund),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
