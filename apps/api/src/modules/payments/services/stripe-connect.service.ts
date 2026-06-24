import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

import { LoggerLib } from '../../../libs/logger.lib';
import { StripeConnectAccountEntity } from '../entities/stripe-connect-account.entity';
import type { ConnectAccountDto } from '../dto/payments.dto';

@Injectable()
export class StripeConnectService {
  private readonly stripe: Stripe | null;
  private readonly accounts = new Map<string, StripeConnectAccountEntity>();

  constructor(private readonly logger: LoggerLib) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    this.stripe = apiKey ? new Stripe(apiKey) : null;
  }

  async createConnectAccount(userId: string, dto: ConnectAccountDto): Promise<StripeConnectAccountEntity> {
    const account = new StripeConnectAccountEntity();
    account.id = `connect-${userId}`;
    account.userId = userId;
    account.status = 'pending';
    account.chargesEnabled = false;
    account.payoutsEnabled = false;
    account.createdAt = new Date();
    account.updatedAt = new Date();

    if (this.stripe) {
      const stripeAccount = await this.stripe.accounts.create({
        type: 'express',
        country: dto.country ?? 'US',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      account.stripeAccountId = stripeAccount.id;

      const link = await this.stripe.accountLinks.create({
        account: stripeAccount.id,
        refresh_url: dto.refreshUrl ?? 'http://localhost:3000/settings/payments',
        return_url: dto.returnUrl ?? 'http://localhost:3000/settings/payments/success',
        type: 'account_onboarding',
      });

      account.onboardingUrl = link.url;
    } else {
      account.stripeAccountId = `acct_dev_${userId}`;
      account.onboardingUrl = `https://connect.stripe.com/setup/dev/${userId}`;
      this.logger.log('StripeConnectService', 'Stripe not configured — using dev account');
    }

    this.accounts.set(userId, account);
    return account;
  }

  getAccount(userId: string): StripeConnectAccountEntity | undefined {
    return this.accounts.get(userId);
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    connectedAccountId?: string,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    if (!this.stripe) {
      return {
        clientSecret: `pi_dev_secret_${Date.now()}`,
        paymentIntentId: `pi_dev_${Date.now()}`,
      };
    }

    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      transfer_data: connectedAccountId ? { destination: connectedAccountId } : undefined,
    });

    return {
      clientSecret: intent.client_secret ?? '',
      paymentIntentId: intent.id,
    };
  }
}
