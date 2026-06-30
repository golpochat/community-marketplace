import type Stripe from 'stripe';

import { getStripeConnectChargeModel } from '@community-marketplace/config';

export interface MarketplacePaymentMetadata {
  listingId: string;
  buyerId: string;
  sellerId: string;
  paymentId?: string;
}

export function buildPaymentIntentParams(options: {
  amountCents: number;
  currency: string;
  platformFeeCents: number;
  connectAccountId: string;
  metadata: MarketplacePaymentMetadata;
}): Stripe.PaymentIntentCreateParams {
  const metadata: Record<string, string> = {
    listingId: options.metadata.listingId,
    buyerId: options.metadata.buyerId,
    sellerId: options.metadata.sellerId,
    charge_model: getStripeConnectChargeModel(),
  };
  if (options.metadata.paymentId) {
    metadata.paymentId = options.metadata.paymentId;
  }

  const base: Stripe.PaymentIntentCreateParams = {
    amount: options.amountCents,
    currency: options.currency.toLowerCase(),
    metadata,
  };

  if (getStripeConnectChargeModel() === 'destination') {
    return {
      ...base,
      application_fee_amount: options.platformFeeCents,
      transfer_data: { destination: options.connectAccountId },
    };
  }

  return {
    ...base,
    metadata: {
      ...metadata,
      settlement_status: 'pending',
    },
  };
}

export function buildCheckoutPaymentIntentData(options: {
  amountCents: number;
  currency: string;
  platformFeeCents: number;
  connectAccountId: string;
  metadata: MarketplacePaymentMetadata;
}): Stripe.Checkout.SessionCreateParams.PaymentIntentData {
  const params = buildPaymentIntentParams(options);
  return {
    application_fee_amount: params.application_fee_amount,
    transfer_data: params.transfer_data,
    metadata: params.metadata,
  };
}
