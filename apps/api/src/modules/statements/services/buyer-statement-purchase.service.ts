import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { BuyerStatementIntentResponse, PlatformPurchase } from '@community-marketplace/types';
import type { ConfirmBuyerStatementInput, CreateBuyerStatementIntentInput } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { mapPlatformPurchase } from '../../monetization/mappers/monetization.mapper';
import { roundMoney } from '../../monetization/lib/boost.lib';
import { StripeConnectService } from '../../payments/services/stripe-connect.service';
import { statementPeriodBounds } from '../lib/account-statement.types';
import { AccountStatementService } from './account-statement.service';
import { BuyerStatementFulfillmentService } from './buyer-statement-fulfillment.service';
import { formatStatementPeriodLabel } from '../lib/account-statement.types';

@Injectable()
export class BuyerStatementPurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeConnect: StripeConnectService,
    private readonly statements: AccountStatementService,
    private readonly fulfillment: BuyerStatementFulfillmentService,
  ) {}

  async createIntent(
    buyerId: string,
    dto: CreateBuyerStatementIntentInput,
  ): Promise<BuyerStatementIntentResponse> {
    const { year, month } = dto;
    await this.assertEligible(buyerId, year, month);

    const pricing = await this.statements.resolveBuyerStatementPrice();
    if (!pricing.enabled) {
      throw new BadRequestException('Buyer statements are not available');
    }

    const existing = await this.findUnlockPurchase(buyerId, year, month);
    if (existing?.status === 'succeeded') {
      throw new BadRequestException('Statement for this period is already unlocked');
    }
    if (existing?.status === 'pending' && existing.clientSecret) {
      return {
        purchase: mapPlatformPurchase(existing),
        clientSecret: existing.clientSecret,
      };
    }

    const amount = roundMoney(pricing.amount);
    const purchase = await this.prisma.platformPurchase.create({
      data: {
        userId: buyerId,
        type: 'buyer_statement',
        status: 'pending',
        amount,
        currency: pricing.currency,
        metadata: {
          year,
          month,
          periodLabel: formatStatementPeriodLabel(year, month),
          priceAtPurchase: amount,
        },
      },
    });

    const { providerPaymentId, clientSecret } = await this.createStripeIntent(
      amount,
      pricing.currency,
      {
        type: 'buyer_statement',
        userId: buyerId,
        platformPurchaseId: purchase.id,
        year: String(year),
        month: String(month),
      },
    );

    const updated = await this.prisma.platformPurchase.update({
      where: { id: purchase.id },
      data: { providerPaymentId, clientSecret },
    });

    return {
      purchase: mapPlatformPurchase(updated),
      clientSecret,
    };
  }

  async confirm(buyerId: string, dto: ConfirmBuyerStatementInput): Promise<PlatformPurchase> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: dto.purchaseId },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.userId !== buyerId) {
      throw new ForbiddenException('You can only confirm your own purchases');
    }
    if (purchase.type !== 'buyer_statement') {
      throw new BadRequestException('Invalid purchase type');
    }

    const stripe = this.stripeConnect.getStripeClient();
    if (stripe && purchase.providerPaymentId) {
      const intent = await stripe.paymentIntents.retrieve(purchase.providerPaymentId);
      if (intent.status === 'succeeded') {
        await this.fulfillment.fulfillBuyerStatement(purchase.id);
      } else if (intent.status === 'canceled') {
        await this.prisma.platformPurchase.update({
          where: { id: purchase.id },
          data: { status: 'failed' },
        });
      }
    } else {
      await this.fulfillment.fulfillBuyerStatement(purchase.id);
    }

    const row = await this.prisma.platformPurchase.findUniqueOrThrow({
      where: { id: purchase.id },
    });
    if (row.status === 'succeeded') {
      await this.ensureStatementStored(row);
    }
    return mapPlatformPurchase(row);
  }

  async fulfillFromWebhook(purchaseId: string): Promise<void> {
    const fulfilled = await this.fulfillment.fulfillBuyerStatement(purchaseId);
    if (!fulfilled) return;
    const row = await this.prisma.platformPurchase.findUniqueOrThrow({ where: { id: purchaseId } });
    if (row.status === 'succeeded') {
      await this.ensureStatementStored(row);
    }
  }

  private async ensureStatementStored(purchase: {
    id: string;
    userId: string;
    receiptKey: string | null;
    metadata: unknown;
  }): Promise<void> {
    if (purchase.receiptKey?.endsWith('.pdf')) return;
    const meta = this.readMetadata(purchase.metadata);
    const year = Number(meta.year);
    const month = Number(meta.month);
    if (!year || !month) return;
    const key = await this.statements.storeBuyerStatementPdf(
      purchase.userId,
      year,
      month,
      purchase.id,
    );
    await this.prisma.platformPurchase.update({
      where: { id: purchase.id },
      data: { receiptKey: key, receiptGeneratedAt: new Date() },
    });
  }

  private async assertEligible(buyerId: string, year: number, month: number): Promise<void> {
    const status = await this.statements.getBuyerStatementStatus(buyerId, year, month);
    if (status.unlocked) {
      throw new BadRequestException('Statement for this period is already unlocked');
    }

    const { start, end } = statementPeriodBounds(year, month);
    const count = await this.prisma.payment.count({
      where: {
        buyerId,
        status: 'succeeded',
        createdAt: { gte: start, lte: end },
      },
    });
    if (count === 0) {
      throw new BadRequestException('No purchases found for this period');
    }
  }

  private async findUnlockPurchase(buyerId: string, year: number, month: number) {
    const rows = await this.prisma.platformPurchase.findMany({
      where: {
        userId: buyerId,
        type: 'buyer_statement',
        status: { in: ['pending', 'succeeded'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.find((row) => {
      const meta = this.readMetadata(row.metadata);
      return meta.year === year && meta.month === month;
    });
  }

  private readMetadata(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
  }

  private async createStripeIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ) {
    const stripe = this.stripeConnect.getStripeClient();
    const normalizedCurrency = currency.toLowerCase();

    if (stripe) {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: normalizedCurrency,
        metadata,
      });
      return {
        providerPaymentId: intent.id,
        clientSecret: intent.client_secret ?? '',
      };
    }

    return {
      providerPaymentId: `pi_dev_buyer_statement_${Date.now()}`,
      clientSecret: `pi_dev_buyer_statement_secret_${Date.now()}`,
    };
  }
}
