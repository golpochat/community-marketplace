import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';

import type { StripeConnectAccount } from '@community-marketplace/types';
import { PLATFORM_COUNTRY_CODE } from '@community-marketplace/config';
import type { ConnectOnboardInput } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { mapConnectAccount } from '../mappers/payment.mapper';
import { PaymentsAuditService } from './payments-audit.service';

@Injectable()
export class StripeConnectService {
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PaymentsAuditService,
    private readonly logger: LoggerLib,
  ) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    this.stripe = apiKey ? new Stripe(apiKey) : null;
  }

  private defaultReturnUrl() {
    return `${process.env.WEB_APP_URL ?? 'http://localhost:3000'}/seller/earnings`;
  }

  async createConnectAccount(
    userId: string,
    dto: ConnectOnboardInput,
  ): Promise<StripeConnectAccount> {
    const existing = await this.prisma.stripeConnectAccount.findUnique({
      where: { userId },
    });

    if (existing) {
      return this.refreshOnboardingLink(userId, dto);
    }

    let stripeAccountId: string;
    let onboardingUrl: string | undefined;

    if (this.stripe) {
      const stripeAccount = await this.stripe.accounts.create({
        type: 'express',
        country: dto.country ?? PLATFORM_COUNTRY_CODE,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      stripeAccountId = stripeAccount.id;

      const link = await this.stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: dto.refreshUrl ?? this.defaultReturnUrl(),
        return_url: dto.returnUrl ?? this.defaultReturnUrl(),
        type: 'account_onboarding',
      });
      onboardingUrl = link.url;
    } else {
      stripeAccountId = `acct_dev_${userId}`;
      onboardingUrl = `https://connect.stripe.com/setup/dev/${userId}`;
      this.logger.log('StripeConnectService', 'Stripe not configured — using dev account');
    }

    const row = await this.prisma.stripeConnectAccount.create({
      data: {
        userId,
        stripeAccountId,
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingComplete: false,
      },
    });

    await this.audit.record('connect_onboarded', userId, undefined, {
      stripeAccountId,
    });

    return mapConnectAccount(row, onboardingUrl);
  }

  async refreshOnboardingLink(
    userId: string,
    dto: ConnectOnboardInput,
  ): Promise<StripeConnectAccount> {
    const row = await this.prisma.stripeConnectAccount.findUnique({
      where: { userId },
    });
    if (!row) throw new NotFoundException('Connect account not found');

    let onboardingUrl: string | undefined;
    if (this.stripe) {
      const link = await this.stripe.accountLinks.create({
        account: row.stripeAccountId,
        refresh_url: dto.refreshUrl ?? this.defaultReturnUrl(),
        return_url: dto.returnUrl ?? this.defaultReturnUrl(),
        type: 'account_onboarding',
      });
      onboardingUrl = link.url;
    } else {
      onboardingUrl = `https://connect.stripe.com/setup/dev/${userId}`;
    }

    return mapConnectAccount(row, onboardingUrl);
  }

  async getAccount(userId: string): Promise<StripeConnectAccount | null> {
    const row = await this.prisma.stripeConnectAccount.findUnique({
      where: { userId },
    });
    if (!row) return null;

    if (this.stripe) {
      await this.syncAccountFromStripe(userId, row.stripeAccountId);
      const updated = await this.prisma.stripeConnectAccount.findUnique({
        where: { userId },
      });
      return updated ? mapConnectAccount(updated) : mapConnectAccount(row);
    }

    return mapConnectAccount(row);
  }

  async getAccountForAdmin(userId: string): Promise<StripeConnectAccount | null> {
    return this.getAccount(userId);
  }

  async assertSellerCanReceivePayments(sellerId: string) {
    const account = await this.getAccount(sellerId);
    if (!account) {
      throw new BadRequestException('Seller has not completed Stripe Connect onboarding');
    }
    if (!account.chargesEnabled || !account.onboardingComplete) {
      throw new BadRequestException('Seller Stripe account is not ready to receive payments');
    }
    return account;
  }

  async syncAccountFromStripe(userId: string, stripeAccountId: string) {
    if (!this.stripe) return;

    const stripeAccount = await this.stripe.accounts.retrieve(stripeAccountId);
    await this.prisma.stripeConnectAccount.update({
      where: { userId },
      data: {
        chargesEnabled: stripeAccount.charges_enabled ?? false,
        payoutsEnabled: stripeAccount.payouts_enabled ?? false,
        onboardingComplete:
          (stripeAccount.charges_enabled ?? false) &&
          (stripeAccount.details_submitted ?? false),
      },
    });
  }

  getStripeClient(): Stripe | null {
    return this.stripe;
  }
}
