import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { PlatformPurchase } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { StripeConnectService } from '../../payments/services/stripe-connect.service';
import { mapPlatformPurchase } from '../mappers/monetization.mapper';
import { isStoreSlotSku, targetStoreSlotLimit } from '../lib/store-slot.lib';
import { roundMoney } from '../lib/boost.lib';

type PurchaseMeta = Record<string, unknown>;

function readMeta(value: unknown): PurchaseMeta {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return { ...(value as PurchaseMeta) };
}

@Injectable()
export class PlatformPurchaseRefundService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeConnect: StripeConnectService,
  ) {}

  /**
   * Admin refund for a succeeded platform SKU purchase.
   * - Stripe refund when a real payment intent was charged
   * - Restore wallet credits used to pay
   * - Best-effort reverse of granted entitlements
   */
  async refundPurchase(
    adminId: string,
    purchaseId: string,
    reason: string,
  ): Promise<PlatformPurchase> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.status === 'refunded') {
      return mapPlatformPurchase(purchase);
    }
    if (purchase.status !== 'succeeded') {
      throw new BadRequestException(
        `Only succeeded purchases can be refunded (status: ${purchase.status})`,
      );
    }

    const meta = readMeta(purchase.metadata);
    if (meta.adminRefunded === true) {
      return mapPlatformPurchase(purchase);
    }

    const providerRefundId = await this.refundStripeIfNeeded(purchase);

    await this.prisma.$transaction(async (tx) => {
      const current = await tx.platformPurchase.findUnique({
        where: { id: purchaseId },
      });
      if (!current || current.status === 'refunded') return;

      const currentMeta = readMeta(current.metadata);
      await this.restoreCreditsUsedToPay(tx, current.userId, currentMeta);
      await this.reverseEntitlements(tx, current, currentMeta);

      await tx.platformPurchase.update({
        where: { id: purchaseId },
        data: {
          status: 'refunded',
          metadata: {
            ...currentMeta,
            adminRefunded: true,
            adminRefundedById: adminId,
            adminRefundReason: reason,
            adminRefundedAt: new Date().toISOString(),
            ...(providerRefundId ? { providerRefundId } : {}),
          } as Prisma.InputJsonValue,
        },
      });
    });

    const row = await this.prisma.platformPurchase.findUniqueOrThrow({
      where: { id: purchaseId },
      include: { user: { select: { email: true } } },
    });
    return {
      ...mapPlatformPurchase(row),
      userEmail: row.user.email ?? undefined,
    };
  }

  private async refundStripeIfNeeded(purchase: {
    id: string;
    amount: Prisma.Decimal;
    providerPaymentId: string | null;
    metadata: unknown;
  }): Promise<string | undefined> {
    const meta = readMeta(purchase.metadata);
    const amountChargedCard = Number(
      meta.amountChargedCard ?? meta.amountDue ?? purchase.amount,
    );
    const providerPaymentId = purchase.providerPaymentId;
    if (!providerPaymentId || !(amountChargedCard > 0)) {
      return undefined;
    }

    const stripe = this.stripeConnect.getStripeClient();
    const useDevFallback =
      !stripe ||
      (process.env.NODE_ENV !== 'production' &&
        providerPaymentId.startsWith('pi_test_'));

    if (useDevFallback) {
      return `re_dev_sku_${Date.now()}`;
    }

    const intent = await stripe!.paymentIntents.retrieve(providerPaymentId);
    if (intent.status === 'canceled') {
      throw new BadRequestException('Payment intent was canceled; cannot refund');
    }

    // PaymentIntent has no amount_refunded — check existing refunds instead.
    const existingRefunds = await stripe!.refunds.list({
      payment_intent: providerPaymentId,
      limit: 10,
    });
    const prior = existingRefunds.data.find(
      (row) => row.status === 'succeeded' || row.status === 'pending',
    );
    if (prior) {
      return prior.id;
    }

    const stripeRefund = await stripe!.refunds.create({
      payment_intent: providerPaymentId,
      reason: 'requested_by_customer',
      metadata: {
        platformPurchaseId: purchase.id,
        kind: 'platform_sku_refund',
      },
    });
    return stripeRefund.id;
  }

  /** Credits the buyer spent toward this SKU (partial or full). */
  private async restoreCreditsUsedToPay(
    tx: Prisma.TransactionClient,
    userId: string,
    meta: PurchaseMeta,
  ): Promise<void> {
    if (meta.creditsRefundedOnSkuRefund === true) return;
    const creditsApplied = Number(meta.creditsApplied ?? 0);
    if (!(creditsApplied > 0)) return;

    const wallet = await tx.buyerWallet.findUnique({ where: { userId } });
    const balance = wallet ? Number(wallet.balance) : 0;
    const nextBalance = roundMoney(balance + creditsApplied);
    await tx.buyerWallet.upsert({
      where: { userId },
      create: { userId, balance: nextBalance },
      update: { balance: nextBalance },
    });
    await tx.walletTransaction.create({
      data: {
        userId,
        type: 'credit_topup',
        amount: creditsApplied,
      },
    });
    meta.creditsRefundedOnSkuRefund = true;
  }

  private async reverseEntitlements(
    tx: Prisma.TransactionClient,
    purchase: {
      id: string;
      userId: string;
      type: string;
      listingId: string | null;
    },
    meta: PurchaseMeta,
  ): Promise<void> {
    switch (purchase.type) {
      case 'listing_boost':
        if (purchase.listingId) {
          await tx.listing.update({
            where: { id: purchase.listingId },
            data: { boostedUntil: new Date() },
          });
        }
        break;
      case 'featured_slot':
        if (purchase.listingId) {
          await tx.listing.update({
            where: { id: purchase.listingId },
            data: {
              isFeatured: false,
              featuredUntil: new Date(),
            },
          });
        }
        break;
      case 'featured_store': {
        const storeId =
          typeof meta.storeId === 'string' ? meta.storeId : undefined;
        if (storeId) {
          await tx.store.update({
            where: { id: storeId },
            data: {
              isFeatured: false,
              featuredUntil: new Date(),
            },
          });
        }
        break;
      }
      case 'seller_growth_pack':
      case 'ai_credit_2':
      case 'ai_credit_5':
      case 'ai_credit_10':
        await this.clawBackWalletCredit(tx, purchase.userId, meta);
        if (purchase.type === 'seller_growth_pack') {
          meta.boostDiscountConsumed = true;
        }
        break;
      case 'store_slot_2':
      case 'store_slot_3':
      case 'store_bundle_3':
        if (isStoreSlotSku(purchase.type)) {
          await this.reverseStoreSlot(tx, purchase.userId, purchase.type, meta);
        }
        break;
      case 'fast_track_verification':
      case 'early_cashback_unlock':
      case 'priority_message':
      case 'buyer_statement':
        // Money/credits reversed; one-shot entitlements are not unwound.
        break;
      default:
        break;
    }
    meta.entitlementsReversed = true;
  }

  private async clawBackWalletCredit(
    tx: Prisma.TransactionClient,
    userId: string,
    meta: PurchaseMeta,
  ): Promise<void> {
    if (meta.walletCreditClawedBack === true) return;
    const walletCreditEur = Number(meta.walletCreditEur ?? 0);
    if (!(walletCreditEur > 0)) return;

    const wallet = await tx.buyerWallet.findUnique({ where: { userId } });
    const balance = wallet ? Number(wallet.balance) : 0;
    const claw = Math.min(balance, walletCreditEur);
    if (claw > 0) {
      await tx.buyerWallet.update({
        where: { userId },
        data: { balance: roundMoney(balance - claw) },
      });
      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'spent',
          amount: claw,
        },
      });
    }
    meta.walletCreditClawedBack = true;
    meta.walletCreditClawedBackAmount = claw;
  }

  private async reverseStoreSlot(
    tx: Prisma.TransactionClient,
    userId: string,
    sku: 'store_slot_2' | 'store_slot_3' | 'store_bundle_3',
    meta: PurchaseMeta,
  ): Promise<void> {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { storeSlotLimit: true },
    });
    const storeCount = await tx.store.count({ where: { userId } });
    const target = targetStoreSlotLimit(sku);
    // Drop one tier toward the prior limit; never below stores already created.
    const previousLimit = Math.max(1, target - 1);
    const nextLimit = Math.max(
      storeCount,
      Math.min(user.storeSlotLimit, previousLimit),
    );
    if (nextLimit < user.storeSlotLimit) {
      await tx.user.update({
        where: { id: userId },
        data: { storeSlotLimit: nextLimit },
      });
    }
    meta.storeSlotLimitAfterRefund = nextLimit;
  }
}
