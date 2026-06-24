import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Payout, SellerEarningsSummary } from '@community-marketplace/types';
import { DEFAULT_CURRENCY } from '@community-marketplace/config';
import type { ManualPayoutInput } from '../dto/payments.dto';

import { PrismaService } from '../../../database/prisma.service';
import { mapPayout } from '../mappers/payment.mapper';
import { PaymentsAuditService } from './payments-audit.service';
import { PaymentsLedgerService } from './payments-ledger.service';
import { StripeConnectService } from './stripe-connect.service';

@Injectable()
export class PaymentsPayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeConnect: StripeConnectService,
    private readonly ledger: PaymentsLedgerService,
    private readonly audit: PaymentsAuditService,
  ) {}

  async listForSeller(sellerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { sellerId };
    const [rows, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payout.count({ where }),
    ]);

    return {
      data: rows.map(mapPayout),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getEarningsSummary(sellerId: string): Promise<SellerEarningsSummary> {
    const [payments, payouts] = await Promise.all([
      this.prisma.payment.findMany({
        where: { sellerId, status: 'succeeded' },
        select: { amount: true, platformFee: true, currency: true },
      }),
      this.prisma.payout.findMany({
        where: { sellerId },
        select: { amount: true, status: true, currency: true },
      }),
    ]);

    const currency = payments[0]?.currency ?? payouts[0]?.currency ?? DEFAULT_CURRENCY;
    const totalEarnings = payments.reduce(
      (sum, p) => sum + Number(p.amount) - Number(p.platformFee ?? 0),
      0,
    );
    const pendingPayouts = payouts
      .filter((p) => p.status === 'pending' || p.status === 'in_transit')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const completedPayouts = payouts
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalEarnings,
      pendingPayouts,
      completedPayouts,
      currency,
      paymentCount: payments.length,
    };
  }

  async triggerManualPayout(
    adminId: string,
    dto: ManualPayoutInput,
  ): Promise<Payout> {
    const connectAccount = await this.stripeConnect.getAccount(dto.sellerId);
    if (!connectAccount?.payoutsEnabled) {
      throw new BadRequestException('Seller is not eligible for payouts');
    }

    const stripe = this.stripeConnect.getStripeClient();
    let providerPayoutId: string | undefined;

    if (stripe) {
      const payout = await stripe.payouts.create(
        {
          amount: Math.round(dto.amount * 100),
          currency: dto.currency.toLowerCase(),
        },
        { stripeAccount: connectAccount.stripeAccountId },
      );
      providerPayoutId = payout.id;
    } else {
      providerPayoutId = `po_dev_${Date.now()}`;
    }

    const row = await this.prisma.payout.create({
      data: {
        sellerId: dto.sellerId,
        amount: dto.amount,
        currency: dto.currency,
        status: 'pending',
        providerPayoutId,
      },
    });

    await this.ledger.record(dto.sellerId, 'debit', dto.amount, dto.currency, {
      referenceId: providerPayoutId,
      metadata: { type: 'manual_payout' },
    });

    await this.audit.record('payout_created', adminId, undefined, {
      payoutId: row.id,
      sellerId: dto.sellerId,
    });

    return mapPayout(row);
  }

  async recordFromWebhook(
    sellerId: string,
    providerPayoutId: string,
    amount: number,
    currency: string,
    status: 'paid' | 'failed',
  ): Promise<Payout> {
    const existing = await this.prisma.payout.findFirst({
      where: { providerPayoutId },
    });
    if (existing) {
      const updated = await this.prisma.payout.update({
        where: { id: existing.id },
        data: { status },
      });
      return mapPayout(updated);
    }

    const row = await this.prisma.payout.create({
      data: {
        sellerId,
        amount,
        currency,
        status,
        providerPayoutId,
      },
    });

    if (status === 'paid') {
      await this.ledger.record(sellerId, 'debit', amount, currency, {
        referenceId: providerPayoutId,
        metadata: { type: 'stripe_payout' },
      });
      await this.audit.record('payout_paid', undefined, undefined, {
        payoutId: row.id,
      });
    } else {
      await this.audit.record('payout_failed', undefined, undefined, {
        payoutId: row.id,
      });
    }

    return mapPayout(row);
  }

  async resolveSellerByStripeAccount(stripeAccountId: string) {
    const account = await this.prisma.stripeConnectAccount.findUnique({
      where: { stripeAccountId },
    });
    if (!account) throw new NotFoundException('Stripe account not linked to seller');
    return account.userId;
  }
}
