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

  private useDevConnectMock(): boolean {
    return !this.stripe;
  }

  private devConnectUrls(dto: ConnectOnboardInput) {
    return {
      stripeAccountId: `acct_dev_${crypto.randomUUID()}`,
      onboardingUrl: dto.returnUrl ?? this.defaultReturnUrl(),
    };
  }

  private mapDevConnectRow(
    row: {
      id: string;
      userId: string;
      stripeAccountId: string;
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      onboardingComplete: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
    onboardingUrl?: string,
  ): StripeConnectAccount {
    if (!this.useDevConnectMock()) {
      return mapConnectAccount(row, onboardingUrl);
    }
    return mapConnectAccount(
      {
        ...row,
        chargesEnabled: true,
        payoutsEnabled: true,
        onboardingComplete: true,
      },
      onboardingUrl,
    );
  }

  private mapStripeError(error: unknown): never {
    if (error instanceof Stripe.errors.StripeError) {
      const connectSignupHint =
        error.message.includes('signed up for Connect') ||
        error.code === 'account_invalid'
          ? ' Enable Connect at https://dashboard.stripe.com/test/connect (use Test mode), then try again.'
          : '';
      throw new BadRequestException(`${error.message}${connectSignupHint}`);
    }
    throw error;
  }

  async createConnectAccount(
    userId: string,
    dto: ConnectOnboardInput,
  ): Promise<StripeConnectAccount> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, displayName: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.stripeConnectAccount.findUnique({
      where: { userId },
    });

    if (existing) {
      return this.refreshOnboardingLink(userId, dto);
    }

    let stripeAccountId: string;
    let onboardingUrl: string | undefined;

    if (this.stripe) {
      try {
        const stripeAccount = await this.stripe.accounts.create({
          type: 'express',
          country: dto.country ?? PLATFORM_COUNTRY_CODE,
          email: user.email,
          business_profile: user.displayName
            ? { name: user.displayName }
            : undefined,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          metadata: { userId },
        });
        stripeAccountId = stripeAccount.id;

        const link = await this.stripe.accountLinks.create({
          account: stripeAccountId,
          refresh_url: dto.refreshUrl ?? this.defaultReturnUrl(),
          return_url: dto.returnUrl ?? this.defaultReturnUrl(),
          type: 'account_onboarding',
        });
        onboardingUrl = link.url;
      } catch (error) {
        this.mapStripeError(error);
      }
    } else {
      const dev = this.devConnectUrls(dto);
      stripeAccountId = dev.stripeAccountId;
      onboardingUrl = dev.onboardingUrl;
      this.logger.log('StripeConnectService', 'Stripe not configured — using dev Connect account');
    }

    const row = await this.prisma.stripeConnectAccount.create({
      data: {
        userId,
        stripeAccountId,
        chargesEnabled: this.useDevConnectMock(),
        payoutsEnabled: this.useDevConnectMock(),
        onboardingComplete: this.useDevConnectMock(),
      },
    });

    await this.audit.record('connect_onboarded', userId, undefined, {
      stripeAccountId,
    });

    return this.mapDevConnectRow(row, onboardingUrl);
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
      try {
        const link = await this.stripe.accountLinks.create({
          account: row.stripeAccountId,
          refresh_url: dto.refreshUrl ?? this.defaultReturnUrl(),
          return_url: dto.returnUrl ?? this.defaultReturnUrl(),
          type: 'account_onboarding',
        });
        onboardingUrl = link.url;
      } catch (error) {
        this.mapStripeError(error);
      }
    } else {
      onboardingUrl = dto.returnUrl ?? this.defaultReturnUrl();
    }

    return this.mapDevConnectRow(row, onboardingUrl);
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

    return this.mapDevConnectRow(row);
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

    this.logger.log('StripeConnectService', 'accounts.retrieve', { stripeAccountId });
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

  async createDashboardLoginLink(userId: string): Promise<{ url: string }> {
    const row = await this.prisma.stripeConnectAccount.findUnique({
      where: { userId },
    });
    if (!row) throw new NotFoundException('Connect account not found');

    if (!this.stripe) {
      return { url: this.defaultReturnUrl() };
    }

    try {
      this.logger.log('StripeConnectService', 'accounts.createLoginLink', {
        stripeAccountId: row.stripeAccountId,
      });
      const link = await this.stripe.accounts.createLoginLink(row.stripeAccountId);
      return { url: link.url };
    } catch (error) {
      this.mapStripeError(error);
    }
  }

  getStripeClient(): Stripe | null {
    return this.stripe;
  }
}
