import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { OrderSettlementResult } from '@community-marketplace/types';
import { usesSeparateConnectCharges } from '@community-marketplace/config';
import type { SettleOrderInput } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { PaymentsAuditService } from './payments-audit.service';
import { StripeConnectService } from './stripe-connect.service';

@Injectable()
export class PaymentsSettlementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeConnect: StripeConnectService,
    private readonly audit: PaymentsAuditService,
    private readonly logger: LoggerLib,
  ) {}

  async settleOrder(
    actorId: string,
    dto: SettleOrderInput,
    options?: { isAdmin?: boolean },
  ): Promise<OrderSettlementResult> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (!options?.isAdmin && payment.sellerId !== actorId) {
      throw new ForbiddenException('Only the seller or an admin can settle this order');
    }
    if (payment.status !== 'succeeded') {
      throw new BadRequestException('Only succeeded payments can be settled');
    }

    if (!usesSeparateConnectCharges()) {
      return {
        paymentId: payment.id,
        status: 'already_settled',
        message:
          'Funds were transferred at payment time using Stripe destination charges.',
        netAmount: Number(payment.amount) - Number(payment.platformFee ?? 0),
        currency: payment.currency,
      };
    }

    const existingSettlement = await this.prisma.paymentAuditLog.findFirst({
      where: {
        paymentId: payment.id,
        eventType: 'seller_settlement',
      },
    });
    if (existingSettlement) {
      const meta = existingSettlement.metadata as { transferId?: string } | null;
      return {
        paymentId: payment.id,
        status: 'already_settled',
        transferId: meta?.transferId,
        netAmount: Number(payment.amount) - Number(payment.platformFee ?? 0),
        currency: payment.currency,
      };
    }

    const connectAccount = await this.stripeConnect.assertSellerCanReceivePayments(
      payment.sellerId,
    );
    const netAmount = Number(payment.amount) - Number(payment.platformFee ?? 0);
    const stripe = this.stripeConnect.getStripeClient();
    let transferId: string;

    if (stripe && payment.providerPaymentId) {
      const transfer = await stripe.transfers.create({
        amount: Math.round(netAmount * 100),
        currency: payment.currency.toLowerCase(),
        destination: connectAccount.stripeAccountId,
        transfer_group: payment.id,
        metadata: {
          paymentId: payment.id,
          listingId: payment.listingId,
          sellerId: payment.sellerId,
        },
      });
      transferId = transfer.id;

      await stripe.paymentIntents.update(payment.providerPaymentId, {
        metadata: {
          settlement_status: 'settled',
          transfer_id: transfer.id,
        },
      });

      this.logger.log('PaymentsSettlementService', 'transfer.created', {
        paymentId: payment.id,
        transferId: transfer.id,
        netAmount,
      });
    } else {
      transferId = `tr_dev_${Date.now()}`;
    }

    await this.audit.record('seller_settlement', actorId, payment.id, {
      transferId,
      netAmount,
      currency: payment.currency,
    });

    return {
      paymentId: payment.id,
      status: 'settled',
      transferId,
      netAmount,
      currency: payment.currency,
    };
  }

  async listPendingSettlements(sellerId: string) {
    if (!usesSeparateConnectCharges()) {
      return { data: [], meta: { total: 0 } };
    }

    const payments = await this.prisma.payment.findMany({
      where: { sellerId, status: 'succeeded' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const settledIds = new Set(
      (
        await this.prisma.paymentAuditLog.findMany({
          where: {
            paymentId: { in: payments.map((p) => p.id) },
            eventType: 'seller_settlement',
          },
          select: { paymentId: true },
        })
      )
        .map((row) => row.paymentId)
        .filter(Boolean) as string[],
    );

    const pending = payments
      .filter((p) => !settledIds.has(p.id))
      .map((p) => ({
        paymentId: p.id,
        listingId: p.listingId,
        amount: Number(p.amount),
        platformFee: Number(p.platformFee ?? 0),
        netAmount: Number(p.amount) - Number(p.platformFee ?? 0),
        currency: p.currency,
        createdAt: p.createdAt.toISOString(),
      }));

    return { data: pending, meta: { total: pending.length } };
  }
}
